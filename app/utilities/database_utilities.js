const CollectionItem = require('../../models/CollectionItem')
const CollectionItemFTS = require('../../models/CollectionItemFTS')
const Tag = require('../../models/Tag')
const AppConfig = require('../../models/AppConfig')
const ActionsLog = require('../../models/ActionsLog')
const { get_sqlready_datetime,days_between } = require('./datetime')


const get_full_fields = table_name => {
   
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
      case 'actions_log':      
         fields = ActionsLog.get_full_fields_list()
         break
      case 'app_config':
         fields = AppConfig.get_full_fields_list()
         break
      default:
         return ''
   }

   if(Array.isArray(fields)) {
      return fields
   }
   return []
}

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
      case 'actions_log':      
         fields = ActionsLog.get_full_fields_list()
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
   return []
}



const get_table_insert_fields = (table_name) => {

   // we switch to whitelist the tables

   switch(table_name) {

      case 'collection_items':

         let collection_items_fields = CollectionItem.get_full_fields_list()
         if(Array.isArray(collection_items_fields)) {
            return collection_items_fields.map((field) => {
               return field.key
            })
         }

      case 'collection_items_fts':

         let collection_items_fts_fields = CollectionItemFTS.get_full_fields_list()
         if(Array.isArray(collection_items_fts_fields)) {
            return collection_items_fts_fields.map((field) => {
               return field.key
            })
         }

      case 'actions_log':
         
         let actions_log = ActionsLog.get_full_fields_list()
         if(Array.isArray(actions_log)) {
            return actions_log.map((field) => {
               return field.key
            })
         }

      case 'tags':
         
         let tags = Tag.get_full_fields_list()
         if(Array.isArray(tags)) {
            return tags.map((field) => {
               return field.key
            })
         }

      case 'app_config':

         let app_config_fields = AppConfig.get_full_fields_list()
         if(Array.isArray(app_config_fields)) {
            return app_config_fields.map((field) => {
               return field.key
            })
         }

      default:
         return ''
   }

}



//
// We consider db snapshots invalid after 'snapshot_valid_for' days, and hence replace
//
const is_valid_snapshot = (date_time_stamp) => {
   if(!date_time_stamp || date_time_stamp === '') return false
   const snapshot_valid_for = 6  // future : configurable?
   const today = get_sqlready_datetime()
   const days_btwn = days_between(date_time_stamp,today)
   return days_btwn < snapshot_valid_for
}



module.exports = {
   get_full_fields,
   get_table_create_fields,
   get_table_insert_fields,
   is_valid_snapshot
}