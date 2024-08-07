const { dirname } = require('node:path')
const { get_sqlready_datetime } = require('../app/utilities/datetime')
const { get_random_int } = require('../app/utilities/utilities')
const { app_console_log } = require('../app/utilities/utilities')
const { DESC } = require('../app/utilities/descriptions')


class AppConfig {

   #database

   #last_error

   //
   // full_fields_list
   //
   static #full_fields_list = [
      {key:'id',data_type:'INTEGER PRIMARY KEY',editable:false,in_card:true,test:{type:'int',min:1,max:9999999999}},
      {key:'root_folder',data_type:'TEXT',editable:true,readonly:true,config_edit:true,in_card:true,desc:DESC.ROOT_FOLDER,is_folder:true,test:{type:'string',min:1,max:255}},
      {key:'recent_records',data_type:'TEXT',editable:true,in_card:false,test:{type:'string',min:1,max:500}},
      {key:'excluded_sub_folders',data_type:'TEXT',editable:true,readonly:false,config_edit:true,in_card:true,desc:DESC.EXCLUDED_SUB_FOLDERS,test:{type:'string',min:0,max:500}},
      {key:'snapshot_at',data_type:'TEXT',editable:true,readonly:true,config_edit:false,in_card:false,desc:DESC.SNAPSHOT_AT,test:{type:'string',min:0,max:500}},
      {key:'created_at',data_type:'TEXT NOT NULL',editable:false,in_card:false,test:{type:'date',min:10,max:24}},
      {key:'updated_at',data_type:'TEXT NOT NULL',editable:false,in_card:false,test:{type:'date',min:10,max:24}},
      {key:'deleted_at',data_type:'TEXT',editable:false,in_card:false,test:{type:'date',min:10,max:24}},
   ]


   constructor(database) {
      this.#database = database
   }

   //
   // 'full_fields_list' is private - but clients can access a copy
   //
   static get_full_fields_list()  {
      let copy_fields_list = this.#full_fields_list.map((field) => {
         return field
      })
      return copy_fields_list
   }


   // future : review purpose and comments on this func
   // Unlike 'collection_items', we need to seed the 'app_config' table w/ application settings on creation

   //
   // initialize the 'app_config' table if empty (we have a single record for config)
   // 
   async initialize_config(db) {

      let count = 0
      
      const result = await new Promise((resolve,reject) => {

         db.serialize(() => {
            
            let sql = `SELECT COUNT(id) as count FROM app_config`

            db.get(sql, (error, rows) => {
               if(error) {
                  reject(error)
               }
               count = rows.count

               // we only seed if no existing record
               if(count < 1) {                  
                  // AppConfig table
                  // we create a single record containing default App Config data
                  // this will only run if no existing record (on setup)                  
                  const no_id_list = AppConfig.get_full_fields_list().filter((field) => {
                     return field.key !== 'id'
                  })
                  const ac_full_fields_list = no_id_list.map((field) => {
                     return `${field.key}`
                  })
                  const ac_inserts = ac_full_fields_list.map(() => '?')
                  const field_values = no_id_list.map((field) => {
                     switch(field.test.type) {
                        case 'date':
                           return field.key === 'deleted_at' ? `""` : `${get_sqlready_datetime(Date())}`
                        case 'string':
                           // future : differences w/ resolving paths and resources etc
                           // btwn dev and production are non-trivial -
                           // for now we just default everything to empty strings
                           // and let user choose paths as they go
                           // (predominantly outside of the app folder anyhow)
                           // return `${AppConfig.default_value(field.key)}`
                           return ''
                        case 'int':
                           return get_random_int()         
                     }
                  })

                  // run(sql [, param, ...] [, callback])
                  db.run(`INSERT INTO app_config (${ac_full_fields_list.toString()}) 
                           VALUES (${ac_inserts})`,
                           field_values,
                           function(error) {
                              // callback - not only errors!
                              if(error) {
                                 return reject(error)
                              }
                              else {
                                 app_console_log('AppConfig Initialization')
                                 app_console_log(' > completed')
                                 resolve({outcome:'success'})
                              }
                        }
                  )
               }
               else {
                  app_console_log('AppConfig Initialization')
                  app_console_log(' > already exists')
                  resolve({outcome:'success'})
               }
            })
         })
      }).catch((error) => {
         this.set_last_error(error)
         throw error.message
      })
      return result
   }
   
   static default_value(key) {
      // get app root folder
      let path = require('path');
      const app_parent_dir = dirname(process.cwd()) 
      const app_folder = path.join(app_parent_dir, '/signal-tower-capture')

      switch(key) {
         case 'root_folder':
            // root_folder is the Collection Root Folder - so likely outside of our app folders
            return `${app_folder}${path.sep}example-collection`
         case 'export_folder':
            return `${app_folder}${path.sep}exports`
         case 'backup_folder':
            return `${app_folder}${path.sep}backups`
         default:
            return ''
      }
   }

   //
   // Current model - we only ever have a single config record - this is a small app.
   //
   async read_single() {
      const fields = AppConfig.#full_fields_list.map((field) => {
         return field.key
      })
      // wrap in a promise to await result
      let result = await new Promise((resolve,reject) => {
         this.#database.all(
            `SELECT ${fields} FROM app_config LIMIT 1`,
            (error, rows) => {
               if(error) {
                  reject(error)
               }
               resolve(rows)            
            }
         )
      }).catch((error) => this.set_last_error(error))

      const field_names = AppConfig.#full_fields_list.map((field) => field.key)
      
      // if no rows found, app_config hasn't been initialized
      if(!result || result.length < 1) result = false
      
      if(result) {
         let response_obj = {
            query:'read_single_app_config',
            outcome:'success',
            app_config_fields:field_names,
            app_config:result[0]
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_single_app_config',
            outcome:'fail',
            message:'There was an error attempting to read the App Config Record. The config data may be missing. [AppConfig.read_single] '
         }
         return fail_response
      }
   }


   //
   // update
   // rcvd app_config_record may contain variable fields -
   // we only update designated fields (keys) provided
   // eg { id: '1', root_folder: 'C:\\wamp64\\www' }  for updating only 'root_folder'
   //
   async update(app_config_record) {

      let designated_fields = []

      // get meta data (blueprints) for all editable fields
      let field_blueprints = AppConfig.#full_fields_list.filter((field) => {
         if(field.editable === true) return field
      })

      // get array of keys to update (exclude id)
      let keys = Object.keys(app_config_record)
      let designated_keys = keys.filter((key) => {
         return key !== 'id'
      })

      // retain designated keys marked as 'editable'
      if(designated_keys) {
         designated_fields = field_blueprints.filter((field) => {
            return designated_keys.some((update_key) => {
               return update_key === field.key
            })
         })
      }
      let field_names = designated_fields.map((field) => {
         return field.key
      })

      if(field_names.length > 0) {      

         // build sql set assignments - eg 'title = ?,tagline = ?...'
         let sql_set_assign_placeholders = field_names.map((field) => {
            return field + ' = ?'
         })

         let updated_at = get_sqlready_datetime()
         sql_set_assign_placeholders+= `, updated_at = "${updated_at}"`

         const sql = `UPDATE app_config 
                     SET ${sql_set_assign_placeholders.toString()} 
                     WHERE id = ? `

         // build values list - eg ["bar",2]
         const field_values = designated_fields.map((field) => {
            return app_config_record[field.key]
         })
         
         const result = await new Promise((resolve,reject) => {
            this.#database.run(
               sql,
               [...field_values,app_config_record.id], 
               function(error) {
                  if(error) {
                     reject(error)
                  }
                  resolve(true)
               }
            )
         }).catch((error) => this.set_last_error(error))

         if(result) {
            return {
               query:'update_app_config',
               outcome:'success',
               app_config:app_config_record
            }
         }
         else {
            let fail_response = {
               query:'update_app_config',
               outcome:'fail',
               message:'There was an error updating the record. [AppConfig.update]  ' + this.#last_error.message
            }
            this.clear_last_error()
            return fail_response
         }
      }
      else {
         return {
            query:'update_app_config',
            outcome:'fail',
            message:'There was an error attempting to update an App Config Record - no valid (editable) fields were provided. [AppConfig.update]'
         }
      }
   }
   

   //
   // error handlers for our promise wrappers around database calls
   // any client method calling set_last_error should clear after use to prevent leaking 
   //
   set_last_error = (error) => {
      this.#last_error = error
   }
   clear_last_error = () => {
      this.#last_error = ''
   }

}



module.exports = AppConfig