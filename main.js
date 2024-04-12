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

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron')
const path = require('node:path')
const Database = require('./app/database/database')
const AppConfig = require('./models/AppConfig')
const ActionsLog = require('./models/ActionsLog')
const CollectionItem = require('./models/CollectionItem')
const Tag = require('./models/Tag')
const DatabaseBackup = require('./models/DatabaseBackup')
const ExportCSVFile = require('./models/ExportCSVFile')
const ExportJSONFile = require('./models/ExportJSONFile')
const ImportCSVFile = require('./models/ImportCSVFile')
const ImportJSONFile = require('./models/ImportJSONFile')
const { is_valid_collection_item,is_valid_int,is_valid_search,is_valid_app_config_record } = require('./app/utilities/validation')
const { NOTIFY } = require('./app/utilities/notifications')
const { LENS } = require('./app/utilities/validation')
const { is_valid_tag } = require('./app/utilities/strings')
const { file_name_from_path } = require('./app/utilities/utilities')
const { get_sqlready_datetime } = require('./app/utilities/datetime')

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
                  click: () => load_client_component('About')
               }
            ]
         }
      ])
   )
   // open devtools if dev env
   if(is_dev) main_window.webContents.openDevTools()

   main_window.loadFile(`.${path.sep}renderer${path.sep}index.html`)
}


app.whenReady().then(async() => {

   // init handlers for one-way events from renderer process

   ipcMain.on('set-title', set_title)


   // init handlers for two-way requests from renderer

   // App handlers
   ipcMain.handle('app:maxSearchTermLen',get_max_search_term_len)
   ipcMain.handle('app:maxTagsCount',get_max_tags_count)

   // Items handlers
   ipcMain.handle('items:getItems',get_collection_items)
   ipcMain.handle('items:getCollectionItemFields',get_collection_item_fields)
   ipcMain.handle('items:getCollectionItem',get_single_collection_item)
   ipcMain.handle('items:addCollectionItem',add_collection_item)
   ipcMain.handle('items:updateCollectionItem',update_collection_item)
   ipcMain.handle('items:deleteCollectionItem',delete_collection_item)
   ipcMain.handle('items:restoreCollectionItem',restore_collection_item)
   ipcMain.handle('items:searchCollectionItems',search_collection_items)

   // Tags handlers
   ipcMain.handle('tags:getTags',get_tags)
   ipcMain.handle('tags:getTagFields',get_tag_fields)
   ipcMain.handle('tags:getTag',get_single_tag)
   ipcMain.handle('tags:addTag',add_tag)
   ipcMain.handle('tags:updateTag',update_tag)
   ipcMain.handle('tags:deleteTag',delete_tag)

   // Config handlers
   ipcMain.handle('config:getAppConfig',get_app_config) 
   ipcMain.handle('config:getAppConfigFields',get_app_config_fields)
   ipcMain.handle('config:updateAppConfig',update_app_config)
   ipcMain.handle('config:setRootFolderPath',set_root_folder_path)

   // Actions handlers
   ipcMain.handle('actions:backupDatabase',backup_database)
   ipcMain.handle('actions:exportCSVFile',export_csv_file)
   ipcMain.handle('actions:exportJSONFile',export_json_file)
   ipcMain.handle('actions:importCSVFile',import_csv_file)
   ipcMain.handle('actions:importJSONFile',import_json_file)
   ipcMain.handle('actions:getActionsLog',get_actions_log)

   // Files handlers
   ipcMain.handle('files:openFolderDlg',open_folder_dlg)
   ipcMain.handle('files:getFolderFilesList',get_folder_files_list)
   ipcMain.handle('files:fileExists',file_exists)
   ipcMain.handle('files:getFolderPath',get_folder_path)
   ipcMain.handle('files:getFilePath',get_file_path)
   ipcMain.handle('files:openFolder',open_folder)
   ipcMain.handle('files:filePathSep',file_path_sep)
   ipcMain.handle('files:saveFile',save_file)
   ipcMain.handle('files:getFileSize',get_file_size)

   // Dev handlers
   if(is_dev) {
      ipcMain.handle('dev:addTestRecords',add_test_records)
   }

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

   // Only load Renderer process ONCE the database has been initialized
   // since we will load App with eg root_folder from database -
   // on initial database creation, we need to ensure some delay
   setTimeout(() => createWindow(),800)
})



// client utility funcs

function notify_client_alert(message) {
   main_window.webContents.send(
      'notify',
      message
   )
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



// main process utility funcs

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
// APP API
//

async function get_max_search_term_len(event) {
   return LENS.MAX_SEARCH
}

async function get_max_tags_count(event) {
   const tag = new Tag(database)
   return tag.get_max_tags_count()
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
   
   const full_fields_list = CollectionItem.get_full_fields_list()
   let result = is_valid_collection_item(full_fields_list,new_collection_item)

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

   const full_fields_list = CollectionItem.get_full_fields_list()
   const result = is_valid_collection_item(full_fields_list,updated_collection_item)

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


async function search_collection_items (event,context) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   
   try {
      if(is_valid_search(context)) {
         let collection_item = new CollectionItem(database)
         const result = await collection_item.search_fts(context)
         return result
      }
      else {
         return {
            outcome:'fail',
            message:'Please enter a valid search term.'
         }
      }
   }
   catch(error) {
      return {
         outcome:'fail',
         message:'Sorry, there was a problem trying to search the database.' + error
      }
   }
}


// future- file getting bigger - do we want 'controllers'?

//
// TAGS API
//

async function get_tags(event,context) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   let tag = new Tag(database)
   const results = await tag.read(context)
   return results
}

async function get_tag_fields (event) { 

   let result = Tag.get_full_fields_list()
   if(result) {
      return {
         query:'get_tag_fields',
         outcome:'success',
         fields:result
      }
   }
   else {
      return {
         query:'get_tag_fields',
         outcome:'fail',
         message:'There was an error attempting to retrieve the Tag fields list. [Tag.get_tag_fields]' 
      }
   }
}

async function get_single_tag(event,id) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let tag = new Tag(database)
      const result = await tag.read_single(id)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'The id was invalid and no matching record could be found.'
      }       
   }
}

async function add_tag(event,new_tag) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   let result = is_valid_tag(new_tag)

   if(result) {
      let tag = new Tag(database)
      const result = await tag.create(new_tag)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:`Sorry, we couldn\'t create a new tag.`,
         errors: result.errors
      }       
   }
}

async function update_tag(event,updated_tag) {
   
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   let result = is_valid_tag(updated_tag)
   if(result) {
      let tag = new Tag(database)
      const result = await tag.update(updated_tag)
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

async function delete_tag(event,id,permanent = false) {
   
   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let tag = new Tag(database)
      const result = permanent ? await tag.hard_delete(id) : await tag.delete(id)
      return result
   }
   else {
      return {
         outcome:'fail',
         message:'The id was invalid and no matching record could be found to delete.'
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



async function update_app_config(event,app_config_record) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE
   
   const full_fields_list = AppConfig.get_full_fields_list()
   const result = is_valid_app_config_record(full_fields_list,app_config_record)

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

async function get_app_config() {
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
      await fs.promises.access(file_path.trim())
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

async function save_file (event,options) {

   const fs = require('fs')
   const  { canceled, filePath  } = await dialog.showSaveDialog(options)
   if(!canceled) {
      return {
         outcome:'success',
         file_path:filePath 
      }
   }
   return {
      outcome:'fail',
      message:''     // we don't notify canceled
   }
}

async function get_file_size (event,file_path) {

   const fs = require('fs')
   try {
      var stats = fs.statSync(file_path)
      var file_bytes_size = stats.size      
      return {
         outcome:'success',
         file_kb_size:Math.ceil(file_bytes_size / 1024)   // calc size in MB = file_bytes_size / (1024*1024)
      }
   }
   catch(error) {
      return {
         outcome:'fail'
      }
   }
}

async function get_file_path (event,options) {
   
   const fs = require('fs')
   const { canceled, filePaths } = await dialog.showOpenDialog(options)
   if(!canceled) {
      return {
         outcome:'success',
         files:filePaths
      }
   }
   return {
      outcome:'fail',
      message:''
   }
}

async function open_folder (event,full_folder_path) {
   const fs = require('fs')
   if (fs.existsSync(full_folder_path)) {
      shell.openPath(path.resolve(full_folder_path))
   }
   else {
      notify_client_alert(
         `The folder could not be found. 
         \n${full_folder_path}
         \nPlease check that the Folder Path in the record is correct and that the folder exists.`)
   }
}

// return OS file segement separator
async function file_path_sep () {
   return path.sep
}

async function open_folder_dlg (event) {

   const fs = require('fs')
   const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })

   if(!canceled) {

      // future : try/catch as get_folder_files_list() below : rollout
      
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

      // we return folder_obj (files_list may be empty)
      return {
         folder_name:filePaths,
         files_list:file_objects_list
      }
   }
}

async function get_folder_files_list (event,folder_path) {

   const fs = require('fs')
   let file_objects_list = []
   let count = 0

   try {
      const files = fs.readdirSync(folder_path)
      files.forEach(file => {
         let file_object = {}
         if (fs.statSync(folder_path + '/' + file).isDirectory()) {
            file_object['type'] = 'dir'
            file_object['filename'] = file
            file_object['path'] = folder_path
         }
         else {
            file_object['type'] = 'file'
            file_object['filename'] = file
            file_object['path'] = folder_path
         }
         file_objects_list[count] = file_object
         count++
      })
      return {
         folder_name:folder_path,
         files_list:file_objects_list
      }
   }
   catch(error) {
      // future : alerts are ugly - custom version?
      notify_client_alert('Sorry, we could not open the folder you selected.' + error)
      return null
   }
}

async function backup_database(event,file_name,file_path) {
   let database_backup = new DatabaseBackup()
   const results = await database_backup.create(file_name,file_path)
   return results
}

async function export_csv_file(event,file_name,file_path) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   let export_csv_file = new ExportCSVFile(database)
   const results = await export_csv_file.create(file_name,file_path)
   return results
}

async function import_csv_file(event,file_path) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   // prep time execution & date/time strs for actions_log
   const start_timer_at = Math.ceil(performance.now())
   const import_start_at = get_sqlready_datetime()

   // import
   let import_csv_file = new ImportCSVFile(database)
   let import_csv_file_obj = null
   try {
      import_csv_file_obj = await import_csv_file.import(file_path)
   }
   catch(error) {
      return {outcome:'fail',message:'Sorry, there was a problem trying to import the CSV file.' + error}
   }

   const end_timer_at = Math.ceil(performance.now())
   const import_end_at = get_sqlready_datetime()
   
   // log action
   let actions_log = new ActionsLog(database)
   actions_log.create({
      action:'import_csv',
      start_at:import_start_at,
      end_at:import_end_at,
      file:file_name_from_path(file_path)
   })
   
   // augment response w/ duration etc
   import_csv_file_obj.duration = end_timer_at - start_timer_at

   return import_csv_file_obj
}

async function export_json_file(event,file_name,file_path) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   let export_json_file = new ExportJSONFile(database)
   const results = await export_json_file.create(file_name,file_path)
   return results
}



async function import_json_file(event,file_path) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   // prep time execution & date/time strs for actions_log
   const start_timer_at = Math.ceil(performance.now())
   const import_start_at = get_sqlready_datetime()

   // import
   let import_json_file = new ImportJSONFile(database)
   let import_json_file_obj = null
   try {
      import_json_file_obj = await import_json_file.import(file_path)
   }
   catch(error) {
      return {outcome:'fail',message:'Sorry, there was a problem trying to import the JSON file.' + error}
   }

   const end_timer_at = Math.ceil(performance.now())
   const import_end_at = get_sqlready_datetime()

   // log action
   let actions_log = new ActionsLog(database)
   actions_log.create({
      action:'import_json',
      start_at:import_start_at,
      end_at:import_end_at,
      file:file_name_from_path(file_path)
   })
   
   // augment response w/ duration etc
   import_json_file_obj.duration = end_timer_at - start_timer_at
   
   return import_json_file_obj
}

async function get_actions_log(event,context) {

   if(!database) return NOTIFY.DATABASE_UNAVAILABLE

   let actions_log = new ActionsLog(database)
   const results = await actions_log.read(context)
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
