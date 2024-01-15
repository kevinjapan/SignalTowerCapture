const CollectionItem = require('../../models/CollectionItem')
const CollectionItemFTS = require('../../models/CollectionItemFTS')
const Tag = require('../../models/Tag')
const AppConfig = require('../../models/AppConfig')


const get_table_create_fields = (table_name) => {

   let fields = null

   switch(table_name) {
      case 'collection_items':
         fields = CollectionItem.get_full_fields_list()
         break
      case 'collection_items_fts':         
         fields = CollectionItemFTS.get_full_fields_list()
         break
      case 'tags':      
         fields = Tag.get_full_fields_list()
         break
      case 'app_config':
         fields = AppConfig.get_full_fields_list()
         break
      default:
         return ''
   }

   if(Array.isArray(fields)) {
      return fields.map((field) => {
         return field.key + ' ' + field.data_type
      })
   }
}



const get_table_insert_fields = (table_name) => {

   switch(table_name) {

      case 'collection_items_fts':

         let collection_items_fts_fields = CollectionItemFTS.get_full_fields_list()

         if(Array.isArray(collection_items_fts_fields)) {
            return collection_items_fts_fields.map((field) => {
               return field.key
            })
         }

      default:
         return ''
   }

}






module.exports = {
   get_table_create_fields,
   get_table_insert_fields
}