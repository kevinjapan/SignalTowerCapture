// 
// Signal Tower Capture
// Desktop Digital Collection Archive Solution
// 
// development:
// npx electronmon .  
// [ensure database file is excluded from hot-reloading in package.json)]
//
// generate deployable:
// npm run make
//

const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const glob = require('glob')
const path = require('node:path')
const Database = require('./app/database/database')
const AppConfig = require('./models/AppConfig')
const CollectionItem = require('./models/CollectionItem')
const DatabaseBackup = require('./models/DatabaseBackup')
const { NOTIFY } = require('./app/utilities/notifications')
const { app_console_log } = require('./app/utilities/utilities')
const { notify_client_alert } = require('./app/utilities/client_utilities')
const { is_valid_snapshot } = require('./app/utilities/database_utilities')
const { get_sqlready_datetime,days_between } = require('./app/utilities/datetime')
const is_dev = process.env.NODE_ENV !== 'production'
const is_mac = process.platform === 'darwin'

// the BrowserWindow object
let main_window

// the Database object
let database


// stop app launching multiple times as Squirrel.Windows inits
// run this as early in the main process as possible
if (require('electron-squirrel-startup')) app.quit();

//
// Subscribe to the ready event
//
app.whenReady().then(async() => {

   app_console_log('Starting Signal Tower Capture')
   app_console_log('-----------------------------')

   ipcMain.on('set-title', set_title)

   if (process.platform === 'win32') {
      app.setAppUserModelId(app.name);
   }
   
   // connect to database, verify the db file exists and we can open it
   let result = await new Database().open_safely()

   if(result.outcome === 'fail') {
      // we notify via alert in renderer, but we don't know if window is ready yet, 
      // so we delay message - inconsequential given infrequency and impact 
      setTimeout(()=> notify_client_alert(result.message),1500)
   }
   database = result.database

   // AppConfig initialization
   const app_config= new AppConfig(database)
   const app_config_result = await app_config.initialize_config(database)

   if(app_config_result.outcome !== 'success') app_console_log('AppConfig initialization failed.')

   house_keeping()

   // require Controllers files
   load_controllers(database)

   // Only load Renderer process ONCE the database has been initialized
   // since we will load App with eg root_folder from database -
   // on initial database creation, we need to ensure some delay
   setTimeout(() => createWindow(),400)
})


//
// Create the Main Window
//
const createWindow = async() => {

   main_window = new BrowserWindow({
      width:is_dev ? 1000 : 800,
      height:600,
      webPreferences: {
         // attach preload script to the main process 
         preload: path.join(__dirname,'preload.js')
      }
   })

   // future : place menu in separate file - but requires load_client_component / main_window
   Menu.setApplicationMenu(
      Menu.buildFromTemplate([
         {
            label: 'File',
            submenu: [
               {
                  label: 'Exit',
                  click:() => close_app()
               }
            ]
         },
         {
            label: 'Records',
            submenu: [
               {
                  label: 'Add a New Record',
                  click: () => load_client_component('AddCollectionItem')
               },
               {
                  type:'separator'
               },
               {
                  label: 'Recent Records',
                  click: () => load_client_component('RecentRecords')
               },
               {
                  label: 'Deleted Records',
                  click: () => load_client_component('DeletedRecords')
               }
            ]
         },
         {
            label: 'Actions',
            submenu: [
               {
                  label: 'Backup Database',
                  click: () => load_client_component('BackupComponent')
               },
               {
                  type:'separator'
               },
               {
                  label: 'Export CSV File',
                  click: () => load_client_component('ExportCSVComponent')
               },
               {
                  label: 'Import CSV File',
                  click: () => load_client_component('ImportCSVComponent')
               },
               {
                  type:'separator'
               },
               {
                  label: 'Export JSON File',
                  click: () => load_client_component('ExportJSONComponent')
               },
               {
                  label: 'Import JSON File',
                  click: () => load_client_component('ImportJSONComponent')
               }
            ]
         },
         {
            label: 'Config',
            submenu: [
               {
                  label: 'Configure Tags',
                  click: () => load_client_component('TagsConfig')
               },
               {
                  type:'separator'
               },
               {
                  label: 'App Settings',
                  click: () => load_client_component('AppConfigForm')
               }
            ]
         },
         {
            label: 'Help',
            submenu: [
               {
                  label: 'About',
                  click: () => load_client_component('About')
               }
            ]
         }
      ])
   )
   // open devtools if dev env
   if(is_dev) main_window.webContents.openDevTools()

   // delay to allow API setups to complete before renderer attempts to call
   setTimeout(() => main_window.loadFile(`.${path.sep}renderer${path.sep}index.html`),300)
}

function load_client_component(component_name = 'About',props) {
   main_window.webContents.send(
      'switch_component',
      component_name,
      props
   )
}

function set_title (event, title) {
   const webContents = event.sender
   const win = BrowserWindow.fromWebContents(webContents)
   win.setTitle(title)   
 }


//
// main process utility funcs
//
function house_keeping() {

   // flush
   flush_deleted_items()

   // database snapshot
   take_database_snapshot()
}

async function flush_deleted_items() {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   
   app_console_log(' Flushing Deleted Items')

   const today = new Date()
   const cut_off_date = new Date(new Date().setDate(today.getDate() - 31))
   let collection_item = new CollectionItem(database)

   const results = await collection_item.flush_deleted(cut_off_date)

   app_console_log(` > ${results.message}`)
   return results
}


// future : make snapshots folder configurable

async function take_database_snapshot() {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   let app_config = new AppConfig(database)
   const app_config_record = await app_config.read_single()

   if(app_config_record && app_config_record.app_config) {

      const { snapshot_at,created_at } = app_config_record.app_config

      // database was just created today!, so we bail
      if(days_between(created_at) < 1) return false

      if(snapshot_at === null || !is_valid_snapshot(snapshot_at)) {

         const file_name = 'stc-db-snapshot.sqlite'
         const file_path = `.\\database\\snapshots\\${file_name}`
         let database_backup = new DatabaseBackup()
         const results = await database_backup.create(file_name,file_path)

         if(results && results.outcome === 'success') {
            app_console_log('A snapshot database backup was saved')
            // register snapshot_at
            const date_time_stamp = get_sqlready_datetime()
            app_config.update({id:1,snapshot_at:date_time_stamp})
         }
         else {
            app_console_log('Attempt to take a snapshot database backup failed')
         }
      }
   }
}


function close_app() {
   if(main_window) {
      main_window.close()
   }
}

// quit app on all windows are closed event
app.on('window-all-closed', () => {
   if(database) {
      database.close()
   }
   if(!is_mac) app.quit()
})




// 
// require all Controller files dynamically
//
function load_controllers(database) {
   const controller_files = glob.sync(path.join(__dirname, 'controllers/*.js'))
   controller_files.forEach((file) => require(file)(database))
}
