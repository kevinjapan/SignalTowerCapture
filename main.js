// 
// Signal Capture
// Ad-hoc Local Desktop Collection Archive Solution (to do : 'ad hoc' ok?)
// 
// development:
// npx electronmon .  
// [ensure database file is excluded from hot-reloading in package.json)]
//
// generate deployable:
// npm run make
//
//

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron')
const path = require('node:path')
const Database = require('./app/database/database')
const AppConfig = require('./models/AppConfig')
const CollectionItem = require('./models/CollectionItem')
const DatabaseBackup = require('./models/DatabaseBackup')
const ExportFile = require('./models/ExportFile')
const { is_valid_collection_item,is_valid_int,is_valid_search,is_valid_app_config_record } = require('./app/utilities/validation')
const { NOTIFY } = require('./app/utilities/notifications')

const is_dev = process.env.NODE_ENV !== 'production'
const is_mac = process.platform === 'darwin'


// dev only, we can populate w/ test records
let TestRecord
if(is_dev) {
   TestRecord = require('./models/TestRecord')
}

// the BrowserWindow object
let main_window

// the Database object
let database

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
            label: 'Help',
            submenu: [
               {
                  label: 'About',
                  // click: () => set_page('set-page',`.${sep}renderer${sep}about.html`,true)
               }
            ]
         }
      ])
   )
   // open devtools if dev env
   if(is_dev) {
      main_window.webContents.openDevTools()
   }
   main_window.loadFile(`.${path.sep}renderer${path.sep}index.html`)
}


app.whenReady().then(async() => {

   // init handlers for one-way events from renderer process

   ipcMain.on('set-title', set_title)


   // init handlers for two-way requests from renderer

   // App handlers
   // ipcMain.handle('app:getActiveComponentPage',get_active_component_page)
   // ipcMain.handle('app:setActiveComponentPage',set_active_component_page)

   // Items handlers
   ipcMain.handle('items:getItems',get_collection_items)
   ipcMain.handle('items:getCollectionItemFields',get_collection_item_fields)
   ipcMain.handle('items:getCollectionItem',get_single_collection_item)
   ipcMain.handle('items:addCollectionItem',add_collection_item)
   ipcMain.handle('items:updateCollectionItem',update_collection_item)
   ipcMain.handle('items:deleteCollectionItem',delete_collection_item)
   ipcMain.handle('items:restoreCollectionItem',restore_collection_item)
   ipcMain.handle('items:searchCollectionItems',search_collection_items)

   // Config handlers
   ipcMain.handle('config:getAppConfigFields',get_app_config_fields)
   ipcMain.handle('config:getAppConfigRecord',get_app_config_record)
   ipcMain.handle('config:updateAppConfig',update_app_config)
   ipcMain.handle('config:getRootFolderPath',get_root_folder_path) 
   ipcMain.handle('config:setRootFolderPath',set_root_folder_path)
   ipcMain.handle('config:backupDatabase',backup_database)  
   ipcMain.handle('config:exportFile',export_file)
   ipcMain.handle('config:getExportFolder',get_export_folder)
   ipcMain.handle('config:getBackupFolder',get_backup_folder)

   // Files handlers
   ipcMain.handle('files:openFile',open_file)
   ipcMain.handle('files:fileExists',file_exists)
   ipcMain.handle('files:getFolderPath',get_folder_path)
   ipcMain.handle('files:getFilePath',get_file_path)
   ipcMain.handle('files:openFolder',open_folder)
   ipcMain.handle('files:filePathSep',file_path_sep)

   // Dev handlers
   if(is_dev) {
      ipcMain.handle('dev:addTestRecords',add_test_records)
   }

   if (process.platform === 'win32') {
      app.setAppUserModelId(app.name);
   }

   createWindow()

   // connect to database, verify the db file exists and we can open it
   let result = await new Database().open_safely()
   if(result.outcome === 'fail') {
      // we notify via alert in renderer, but we don't know if window is ready yet, 
      // so we delay message - inconsequential given infrequency and impact 
      setTimeout(()=> notify_client_alert(result.message),2000)
   }
   database = result.database

   house_keeping()

   // AppConfig initialization
   try {
      await new AppConfig(database).initialize_config(database)
   }
   catch(error) {
      if(database) {
         // we only notify ifthe database is valid - so as to prevent notifications if db also failed
         // delay to allow window to finish initializing
         setTimeout(() => notify_client_alert('AppConfig Initialization failed.\n' + error),2000)
      }
   }
})

function notify_client_alert(message) {
   main_window.webContents.send(
      'notify',
      message
   )
}

function set_title (event, title) {
   const webContents = event.sender
   const win = BrowserWindow.fromWebContents(webContents)
   win.setTitle(title)   
 }


function house_keeping() {
   console.log('HouseKeeping')
   flush_deleted_items()

}

async function flush_deleted_items() {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   
   console.log(' Flushing Deleted Items')

   const today = new Date()
   const cut_off_date = new Date(new Date().setDate(today.getDate() - 30))
   let collection_item = new CollectionItem(database)
   const results = await collection_item.flush_deleted(cut_off_date)

   console.log(' >',results.message)
   return results
}



//
// (COLLECTION) ITEMS API
//

async function get_collection_items (event,context) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   let collection_item = new CollectionItem(database)
   const results = await collection_item.read(context)
   return results
}

async function get_collection_item_fields (event) {
   let result = CollectionItem.get_full_fields_list()
   if(result) {
      let response_obj = {
         query:'get_collection_item_fields',
         outcome:'success',
         fields:result
      }
      return response_obj
   }
   else {
      let fail_response = {
         query:'get_collection_item_fields',
         outcome:'fail',
         message:'There was an error attempting to retrieve the Collection Item fields list. [CollectionItem.get_collection_item_fields]' 
      }
      return fail_response
   }
}

async function get_single_collection_item (event, id) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let collection_item = new CollectionItem(database)
      const result = await collection_item.read_single(id)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'The id was invalid and no matching record could be found.'
      }       
   }
}

async function add_collection_item (event,new_collection_item) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   
   let result = is_valid_collection_item(new_collection_item)

   if(result.outcome === 'success') {
      let collection_item = new CollectionItem(database)
      const result = await collection_item.create(new_collection_item)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'The form contains invalid or missing data and we couldn\'t create a new record.',
         errors: result.errors
      }       
   }
}

async function update_collection_item (event,updated_collection_item) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   let result = is_valid_collection_item(updated_collection_item)

   if(result.outcome === 'success') {
      let collection_item = new CollectionItem(database)
      const result = await collection_item.update(updated_collection_item)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'The form contains invalid or missing data and we couldn\'t update the record.',
         errors: result.errors
      }       
   }
}

async function delete_collection_item (event,id,permanent = false) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let collection_item = new CollectionItem(database)
      const result = permanent ? await collection_item.hard_delete(id) : await collection_item.delete(id)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'The id was invalid and no matching record could be found to delete.'
      }       
   }
}

async function restore_collection_item (event,id) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let collection_item = new CollectionItem(database)
      const result = await collection_item.restore(id)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'The id was invalid and no matching record could be found to restore.'
      }       
   }
}

async function search_collection_items (event,search_obj) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   
   if(is_valid_search(search_obj)) {
      let collection_item = new CollectionItem(database)
      const result = await collection_item.search(search_obj)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'Please enter a valid search term.'
      }
   }
}


//
// CONFIG API
//

async function get_app_config_fields() {

   let result = AppConfig.get_full_fields_list()

   if(result) {
      let response_obj = {
         query:'get_app_config_fields',
         outcome:'success',
         fields:result
      }
      return response_obj
   }
   else {
      let fail_response = {
         query:'get_app_config_fields',
         outcome:'fail',
         message:'There was an error attempting to retrieve the App Config Item fields list. [AppConfig.get_app_config_fields]' 
      }
      return fail_response
   }
}

async function get_app_config_record() {
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   let app_config = new AppConfig(database)
   const result = await app_config.read_single()
   return result
}

async function update_app_config(event,app_config_record) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   
   let result = is_valid_app_config_record(app_config_record)

   if(typeof result !== 'undefined' && result.outcome === 'success') {
      let app_config = new AppConfig(database)
      const result = await app_config.update(app_config_record)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'The form contains invalid or missing data and we couldn\'t update the record.',
         errors: result.errors
      } 
   }
}

async function get_root_folder_path() {
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   let app_config = new AppConfig(database)
   const app_config_record = await app_config.read_single()
   return app_config_record
}

// we use update_app_config for all updates now -
// but retain this to demo how AppConfig.update
// is setup so it *can* handle variable inputs
async function set_root_folder_path(event,app_config_record) {
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   // eg { id: '1', root_folder: 'C:\\wamp64\\www' } 
   let app_config = new AppConfig(database)
   const result = await app_config.update(app_config_record)
   return result
}

async function add_test_records() {
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   if(is_dev) {
      let test_record = new TestRecord(database)
      const results = await test_record.create(100)
      return results
   }
}



//
// FILES API
//

async function file_exists(event,file_path) {
   const fs = require('fs')
   try {
      await fs.promises.access(file_path)
      return {
         outcome:'success'
      }
   }
   catch(error) {
      return {
         outcome:'fail'
      }
   }
}

async function get_folder_path () {
   const fs = require('fs')
   const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
   if(!canceled) {
      return filePaths
   }
 }
 
async function get_file_path () {
   const fs = require('fs')
   const { canceled, filePaths } = await dialog.showOpenDialog()
   if(!canceled) {
      return {
         outcome:'success',
         files:filePaths
      }
   }
   return {
      outcome:'fail',
      message:'Sorry, we failed to select a file.'
   }
}

async function open_folder (event,folder_path) {
   shell.openPath(path.resolve('.','backups'))
}

// return OS file segement separator
async function file_path_sep () {
   return path.sep
}

async function open_file () {

   const fs = require('fs')
   const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })

   if(!canceled) {
      
      // get array of filenames from folder
      let filenames = fs.readdirSync(filePaths[0])
      let file_objects_list = []
      let count = 0

      filenames.forEach(file => {
         let file_object = {}
         if (fs.statSync(filePaths[0] + '/' + file).isDirectory()) {
            file_object['type'] = 'dir'
            file_object['filename'] = file
            file_object['path'] = filePaths[0]
         } 
         else {
            file_object['type'] = 'file'
            file_object['filename'] = file
            file_object['path'] = filePaths[0]
         }
         file_objects_list[count] = file_object
         count++
      })
      return file_objects_list
   }
}

async function backup_database() {
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   let database_backup = new DatabaseBackup(database)
   const results = await database_backup.create()
   return results
}

async function export_file(event) {
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   let export_file = new ExportFile(database)
   const results = await export_file.create()
   return results
}

async function get_export_folder() {
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   let app_config = new AppConfig(database)
   const app_config_record = await app_config.read_single()
   return app_config_record
}

async function get_backup_folder() {
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   let app_config = new AppConfig(database)
   const app_config_record = await app_config.read_single()
   return app_config_record
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
