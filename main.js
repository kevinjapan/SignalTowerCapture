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
//


// to do : review all db calls - inc db.serialize() wrappers where appropriate -
//         eg there are some issues in creating db from scratch.

const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const glob = require('glob')
const path = require('node:path')
const Database = require('./app/database/database')
const AppConfig = require('./models/AppConfig')
const CollectionItem = require('./models/CollectionItem')
const { NOTIFY } = require('./app/utilities/notifications')
const { notify_client_alert } = require('./app/utilities/client_utilities')

const is_dev = process.env.NODE_ENV !== 'production'
const is_mac = process.platform === 'darwin'


// the BrowserWindow object
let main_window

// the Database object
let database


//
// Subscribe to the ready event
//
app.whenReady().then(async() => {

   ipcMain.on('set-title', set_title)

   if (process.platform === 'win32') {
      app.setAppUserModelId(app.name);
   }
   
   // connect to database, verify the db file exists and we can open it
   let result = await new Database().open_safely()
   if(result.outcome === 'fail') {
      // we notify via alert in renderer, but we don't know if window is ready yet, 
      // so we delay message - inconsequential given infrequency and impact 
      setTimeout(()=> notify_client_alert(result.message),2000)
   }
   database = result.database

   // workaround for initial setup, we delay house_keeping to allow table creation to complete
   // future : wait on 'database.open_safely->create_tables' to finish (promisify create_tables sql actions)
   setTimeout(() => house_keeping(),200)

   // AppConfig initialization
   // future : requires timeout to wait on previous db jobs finishing (db initialization only) - why? can we tidy?
   setTimeout(async() => {
      try {
         await new AppConfig(database).initialize_config(database)
      }
      catch(error) {
         if(database) {
            // we only notify if the database is valid to prevent multiple notifications if db also failed
            notify_client_alert('AppConfig Initialization failed.\n' + error)
         }
      }},500)


   // Post-db init, we can configure our Controllers
   load_controllers(database)

   // Only load Renderer process ONCE the database has been initialized
   // since we will load App with eg root_folder from database -
   // on initial database creation, we need to ensure some delay
   setTimeout(() => createWindow(),300)
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
                  label: 'Recent Records',
                  click: () => load_client_component('RecentRecords')
               },
               {
                  label: 'Add a New Record',
                  click: () => load_client_component('AddCollectionItem')
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
                  label: 'Actions',
                  click: () => load_client_component('Actions')
               }
            ]
         },
         {
            label: 'Config',
            submenu: [
               {
                  label: 'Config',
                  click: () => load_client_component('Config')
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



function load_client_component(component_name = 'About') {
   main_window.webContents.send(
      'switch_component',
      component_name
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
   flush_deleted_items()
}

async function flush_deleted_items() {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   
   console.log(' Flushing Deleted Items')

   const today = new Date()
   const cut_off_date = new Date(new Date().setDate(today.getDate() - 31))
   let collection_item = new CollectionItem(database)

   const results = await collection_item.flush_deleted(cut_off_date)

   console.log(' >',results.message)
   return results
}


//
// house-keeping
//
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
