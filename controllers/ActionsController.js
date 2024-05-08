const { ipcMain } = require('electron')
const ActionsLog = require('../models/ActionsLog')
const DatabaseBackup = require('../models/DatabaseBackup')
const ExportCSVFile = require('../models/ExportCSVFile')
const ImportCSVFile = require('../models/ImportCSVFile')
const ExportJSONFile = require('../models/ExportJSONFile')
const ImportJSONFile = require('../models/ImportJSONFile')
const { file_name_from_path } = require('../app/utilities/utilities')
const { get_sqlready_datetime } = require('../app/utilities/datetime')
const { NOTIFY } = require('../app/utilities/notifications')


// Requiring client will inject ref to the database
let actions_controller_database = null


//
// Our exposed API
//
ipcMain.handle('actions:backupDatabase',backup_database)
ipcMain.handle('actions:exportCSVFile',export_csv_file)
ipcMain.handle('actions:exportJSONFile',export_json_file)
ipcMain.handle('actions:importCSVFile',import_csv_file)
ipcMain.handle('actions:importJSONFile',import_json_file)
ipcMain.handle('actions:getActionsLog',get_actions_log)


async function backup_database(event,file_name,file_path) {
   let database_backup = new DatabaseBackup()
   const results = await database_backup.create(file_name,file_path)
   return results
}

async function export_csv_file(event,file_name,file_path) {

   if(!actions_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   let export_csv_file = new ExportCSVFile(actions_controller_database)
   const results = await export_csv_file.create(file_name,file_path)
   return results
}

async function import_csv_file(event,file_path) {

   if(!actions_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   // prep time execution & date/time strs for actions_log
   const start_timer_at = Math.ceil(performance.now())
   const import_start_at = get_sqlready_datetime()

   // import
   let import_csv_file = new ImportCSVFile(actions_controller_database)
   let import_csv_file_obj = null
   try {
      import_csv_file_obj = await import_csv_file.import(file_path)
   }
   catch(error) {

      return {
         outcome:'fail',
         message_arr:[
            'Sorry, there was a problem trying to import the CSV file.' + error
         ]
      }
   }

   const end_timer_at = Math.ceil(performance.now())
   const import_end_at = get_sqlready_datetime()
   
   // log action
   let actions_log = new ActionsLog(actions_controller_database)
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

   if(!actions_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   let export_json_file = new ExportJSONFile(actions_controller_database)
   const results = await export_json_file.create(file_name,file_path)
   return results
}



async function import_json_file(event,file_path) {

   if(!actions_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   // prep time execution & date/time strs for actions_log
   const start_timer_at = Math.ceil(performance.now())
   const import_start_at = get_sqlready_datetime()

   // import
   let import_json_file = new ImportJSONFile(actions_controller_database)
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
   let actions_log = new ActionsLog(actions_controller_database)
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

   if(!actions_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   let actions_log = new ActionsLog(actions_controller_database)
   const results = await actions_log.read(context)
   return results
}



//
// enable database injection
//
module.exports = function(database) {
   actions_controller_database = database
}

