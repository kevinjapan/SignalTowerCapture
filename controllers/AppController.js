const { ipcMain } = require('electron')
const APIKeys = require('../app/APIKeys/APIKeys')
const Tag = require('../models/Tag')
const { LENS } = require('../app/utilities/validation')


// Requiring client will inject ref to the database
let app_controller_database = null


//
// Our exposed API
//
ipcMain.handle('app:maxSearchTermLen',get_max_search_term_len)
ipcMain.handle('app:maxTagsCount',get_max_tags_count)
ipcMain.handle('app:getResponseObjectKeys',get_response_obj_keys)


async function get_max_search_term_len(event) {
   return LENS.MAX_SEARCH
}

async function get_max_tags_count(event) {
   const tag = new Tag(app_controller_database)
   return tag.get_max_tags_count()
}

function get_response_obj_keys(event,query_key) {

   const keys = new APIKeys().get_response_keys(query_key)
   if(keys) {
      let response_obj = {
         query:'get_response_obj_keys',
         outcome:'success',
         keys:keys
      }
      return response_obj
   }
   else {
      let fail_response = {
         query:'get_response_obj_keys',
         outcome:'fail',
         message:'There was an error attempting to retrieve the Response object keys. [App.get_response_obj_keys]' 
      }
      return fail_response
   }
}




//
// enable database injection
//
module.exports = function(database) {
   app_controller_database = database
}

