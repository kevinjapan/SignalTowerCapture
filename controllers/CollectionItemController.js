const { ipcMain } = require('electron')
const CollectionItem = require('../models/CollectionItem')
const { NOTIFY } = require('../app/utilities/notifications')
const { is_valid_collection_item,is_valid_int,is_valid_search } = require('../app/utilities/validation')



// Requiring client will inject ref to the database
let collection_item_controller_db = null


//
// Our exposed API
//
ipcMain.handle('items:getItems',get_collection_items)
ipcMain.handle('items:getCollectionItemFields',get_collection_item_fields)
ipcMain.handle('items:getCollectionItem',get_single_collection_item)
ipcMain.handle('items:addCollectionItem',add_collection_item)
ipcMain.handle('items:updateCollectionItem',update_collection_item)
ipcMain.handle('items:deleteCollectionItem',delete_collection_item)
ipcMain.handle('items:restoreCollectionItem',restore_collection_item)
ipcMain.handle('items:searchCollectionItems',search_collection_items)



async function get_collection_items (event,context) {

   if(!collection_item_controller_db) return NOTIFY.DATABASE_UNAVAILABLE

   let collection_item = new CollectionItem(collection_item_controller_db)
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

   if(!collection_item_controller_db) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let collection_item = new CollectionItem(collection_item_controller_db)
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

   if(!collection_item_controller_db) return NOTIFY.DATABASE_UNAVAILABLE
   
   const full_fields_list = CollectionItem.get_full_fields_list()
   let result = is_valid_collection_item(full_fields_list,new_collection_item)

   if(result.outcome === 'success') {
      let collection_item = new CollectionItem(collection_item_controller_db)
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

   if(!collection_item_controller_db) return NOTIFY.DATABASE_UNAVAILABLE

   const full_fields_list = CollectionItem.get_full_fields_list()
   const result = is_valid_collection_item(full_fields_list,updated_collection_item)

   if(result.outcome === 'success') {
      let collection_item = new CollectionItem(collection_item_controller_db)
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

   if(!collection_item_controller_db) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let collection_item = new CollectionItem(collection_item_controller_db)
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

   if(!collection_item_controller_db) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let collection_item = new CollectionItem(collection_item_controller_db)
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

   if(!collection_item_controller_db) return NOTIFY.DATABASE_UNAVAILABLE
   
   try {
      if(is_valid_search(context)) {
         let collection_item = new CollectionItem(collection_item_controller_db)
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




//
// enable database injection
//
module.exports = function(database) {
   collection_item_controller_db = database
}

