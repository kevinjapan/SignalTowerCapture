const { ipcMain } = require('electron')
const Tag = require('../models/Tag')
const { is_valid_tag } = require('../app/utilities/strings')
const { is_valid_int } = require('../app/utilities/validation')
const { NOTIFY } = require('../app/utilities/notifications')


// Requiring client will inject ref to the database
let tag_controller_database = null


//
// Our exposed API
//
ipcMain.handle('tags:getTags',get_tags)
ipcMain.handle('tags:getTagFields',get_tag_fields)
ipcMain.handle('tags:getTag',get_single_tag)
ipcMain.handle('tags:addTag',add_tag)
ipcMain.handle('tags:updateTag',update_tag)
ipcMain.handle('tags:deleteTag',delete_tag)


async function get_tags(event,context) {

   if(!tag_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   let tag = new Tag(tag_controller_database)
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

   if(!tag_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let tag = new Tag(tag_controller_database)
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

   if(!tag_controller_database) return NOTIFY.DATABASE_UNAVAILABLE
   let result = is_valid_tag(new_tag)

   if(result) {
      let tag = new Tag(tag_controller_database)
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
   
   if(!tag_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   let result = is_valid_tag(updated_tag)
   if(result) {
      let tag = new Tag(tag_controller_database)
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
   
   if(!tag_controller_database) return NOTIFY.DATABASE_UNAVAILABLE

   if(is_valid_int(id)) {
      let tag = new Tag(tag_controller_database)
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
// enable database injection
//
module.exports = function(database) {
   tag_controller_database = database
}

