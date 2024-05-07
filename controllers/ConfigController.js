const { ipcMain } = require('electron')
const AppConfig = require('../models/AppConfig')
const { is_valid_app_config_record } = require('../app/utilities/validation')
const { NOTIFY } = require('../app/utilities/notifications')


// Requiring client will inject ref to the database
let config_controller_database = null


//
// Our exposed API
//
ipcMain.handle('config:getAppConfig',get_app_config) 
ipcMain.handle('config:getAppConfigFields',get_app_config_fields)
ipcMain.handle('config:updateAppConfig',update_app_config)
ipcMain.handle('config:setRootFolderPath',set_root_folder_path)




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

   if(!config_controller_database) return NOTIFY.DATABASE_UNAVAILABLE
   
   const full_fields_list = AppConfig.get_full_fields_list()
   const result = is_valid_app_config_record(full_fields_list,app_config_record)

   if(typeof result !== 'undefined' && result.outcome === 'success') {
      let app_config = new AppConfig(config_controller_database)
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
   if(!config_controller_database) return NOTIFY.DATABASE_UNAVAILABLE
   let app_config = new AppConfig(config_controller_database)
   const app_config_record = await app_config.read_single()
   return app_config_record
}

// we use update_app_config for all updates now -
// but retain this to demo how AppConfig.update
// is setup so it *can* handle variable inputs
async function set_root_folder_path(event,app_config_record) {
   if(!config_controller_database) return NOTIFY.DATABASE_UNAVAILABLE
   // eg { id: '1', root_folder: 'C:\\wamp64\\www' } 
   let app_config = new AppConfig(config_controller_database)
   const result = await app_config.update(app_config_record)
   return result
}

async function add_test_records() {
   if(!config_controller_database) return NOTIFY.DATABASE_UNAVAILABLE
   if(is_dev) {
      let test_record = new TestRecord(config_controller_database)
      const results = await test_record.create(100)
      return results
   }
}




//
// enable database injection
//
module.exports = function(database) {
   config_controller_database = database
}

