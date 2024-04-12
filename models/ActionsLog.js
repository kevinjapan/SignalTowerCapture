const { dirname } = require('node:path')
const { get_sqlready_datetime } = require('../app/utilities/datetime')
const { get_random_int } = require('../app/utilities/utilities')
const { DESC } = require('../app/utilities/descriptions')

const { get_status_condition_sql } = require('../app/utilities/search_utilities')


// ActionsLog matches batches of records to actions performed at specific times
//
// eg
// action		   start_at	   end_at
// ----------------------------------------------------------------------------------------------
// import_csv	   11:14		   11:20			we can use to rollback (remove) imported records
// import_json	   4:50		   4:55
// delete		   7:12		   7:12			we can use to rollback (undelete) batch deleted records
//

// ---------------------------------- to do :
// ActionsLog
// - log import progress..?
// - log import actions - in ActionsLog
// - implement ActionsLog model (as a queue for each 'action')
// - view ActionsLog
// - enable 'rollback' on ActionsLog
// ----------------------------------

// to do :
// - add import history (after log import actions above)
//   - can rollback (use time start and end of process to delete records)
//   - save to log database table (?)
//     - action  (we can name eg imports by their timestamp)
//     - start time   
//     - end time
//   - we need to manage queue here - on adding a specific 'action' log record, if current queue > 10, delete oldest log record of that 'action'
//   - log for 'type' of import [csv/json/..]

// to do : verify all work:
// create
// delete
// read
// read_all
// read_single

class ActionsLog {

   #database

   // log is a queue for each action type (FIFO)
   #max_queue_count = 100         // to do : set to 10 or 20

   // every read-all needs an absolute upper limit!
   #limit_read_all_records = this.#max_queue_count

   #last_error

   //
   // full_fields_list
   //
   static #full_fields_list = [
      {key:'id',data_type:'INTEGER PRIMARY KEY',in_card:true,test:{type:'int',min:1,max:9999999999}},
      {key:'action',data_type:'TEXT',test:{type:'string',min:1,max:60}},
      {key:'start_at',data_type:'TEXT NOT NULL',test:{type:'string',min:1,max:24}},
      {key:'end_at',data_type:'TEXT NOT NULL',test:{type:'string',min:1,max:24}},
      {key:'created_at',data_type:'TEXT NOT NULL',test:{type:'date',min:10,max:24}},
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


   //
   // READ : 
   // Not paginated since we limit all logs to last 20 actions (queue)
   // to do : filter_fields?
   async read(context) {

      let total_count = 0  
      let sql


      console.log('you may just be right',context)
      
      // filters
      // filters target known specific conditional tests
      let action = 'action = ""'              // our default 'WHERE' clause
       if(context.filters) {
         if(context.filters.action) action = `action = "${context.filters.action}"`
      }

      // field_filters target conditional tests against fields/cols within the record
      // let field_filters_sql = ''
      // if(context.field_filters) {         
      //    context.field_filters.forEach(filter => {
      //       let value = trim_char(filter.value,',')
      //       if(filter.test && filter.test.toUpperCase() === 'IN') {
      //          field_filters_sql += ` AND ${filter.field} IN (${value})`
      //       }
      //       else {
      //          field_filters_sql += ` AND ${filter.field} = "${value}"`
      //       }
      //    })
      // }

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {
            
            // to do : if not paginating, we can remove this
            sql = `SELECT COUNT(id) as count FROM actions_log WHERE ${action}`
            this.#database.get(sql, (error, rows) => {
               if(error) {
                  reject(error)
               }
               if(rows) total_count = rows.count
            })

            const fields = ActionsLog.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                     FROM actions_log 
                     WHERE ${action}                     
                     ORDER BY created_at DESC
                     LIMIT ${this.#max_queue_count}`

            this.#database.all(sql, (error, rows) => {
               if(error) reject(error)
               resolve(rows)        
            })
         })
      }).catch((error) => this.set_last_error(error))

      if(result) {
         let response_obj = {
            query:'read_actions_log',
            outcome:'success',
            count:total_count,
            actions:result
         }
      console.log('response_obj',response_obj)
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_actions_log',
            outcome:'fail',
            message:'There was an error attempting to read the actions log. [ActionsLog.read]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }


   //
   // Read All - Non-paginated
   // we only read one action type at a time / we only ever permit max_queue_count records for any single action type
   //
   async read_all() {

      let total_count = 0 //this.count().count   
      let sql

      // filters
      let action = 'action = ""'
      let order_by = 'created_at'
      if(context.filters) {
         action = get_status_condition_sql('actions_log',context.filters.action)
      }

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {
            
            sql = `SELECT COUNT(id) as count FROM actions_log WHERE ${action}`
            this.#database.get(sql, (error, rows) => {
               if(error) reject(error)
               total_count = rows.count           
            })

            const fields = ActionsLog.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                     FROM actions_log 
                     WHERE ${action}
                     ORDER BY ${order_by}
                     LIMIT ${this.#limit_read_all_records}`
            this.#database.all(sql, (error, rows) => {
               if(error) reject(error)
               resolve(rows)            
            })
         })
      }).catch((error) => this.set_last_error(error))

      const exportable_fields = ActionsLog.#full_fields_list.filter((field) => {
         if(field.export === true) return field
      })

      if(result) {
         let response_obj = {
            query:'read_actions_log',
            outcome:'success',
            count:total_count,
            actions:result
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_actions_log',
            outcome:'fail',
            message:'There was an error attempting to read the actions log. [ActionsLog.read_all]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }



   //
   // READ SINGLE
   //
   async read_single() {

      if(!Number.isInteger(parseInt(id))) {
         return {
            outcome:'fail',
            message:'There was an error attempting to read the actions log record. '
         } 
      }
      
      const field_keys = ActionsLog.#full_fields_list.map((field) => {
         return field.key
      })

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {
         this.#database.all(
            `SELECT ${field_keys} FROM actions_log WHERE id = ${id}`,
            (error, rows) => {
               if(error) {
                  reject(error)
               }
               resolve(rows)            
            }
         )
      }).catch((error) => this.set_last_error(error))

      const fields = ActionsLog.#full_fields_list.map((field) => {
         return {
            key:field.key,
            editable:field.editable,
            test:field.test
         }
      })
      
      if(result) {
         let response_obj = {
            query:'read_single_tag',
            outcome:'success',
            actions_log_fields:fields,
            actions:result[0]
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_single_tag',
            outcome:'fail',
            message:'There was an error attempting to read the action log record. [ActionsLog.read_single] ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }


   //
   // CREATE
   //
   async create(action_obj) {

      // augment record
      action_obj.created_at = get_sqlready_datetime()

      let sql

      // verify we are not exceeding specific action type queue len
      const count = await new Promise((resolve,reject) => {
         sql = `SELECT COUNT(id) as count FROM actions_log WHERE action = "import_json" `   // to do : enter from action_object
         this.#database.get(sql, (error, rows) => {
            // to do : replace 'import_json' above line w/ action_obj.action
            if(error) {
               reject(error)
            }
            if(rows) resolve(rows.count)
         })
      }).catch((error) => {
         this.set_last_error(error)
      })

      // manage action type queue
      if(count >= this.#max_queue_count) {
      
         // to do : queue management - only ever permit max of this.#max_queue_count of any single record type -
         //                            if already max, remove the oldest record of that type (type eg 'import_json')
         // delete oldest

      }

      // create new ActionsLog record
      if(count < this.#max_queue_count) {

         let fields = ActionsLog.#full_fields_list

         const field_keys = fields.map(field => field.key).filter(field => field !== 'id')

         // build '?' string
         const inserts = field_keys.map(field => '?')
 
         // build values list - eg ["import_json","2024-03-05",..]
         const field_values = field_keys.map((field_key) => {
            if(action_obj[field_key] !== undefined) return action_obj[field_key]
         })

         sql = `INSERT INTO actions_log(${field_keys.toString()}) VALUES(${inserts.toString()})`

         const result = await new Promise((resolve,reject) => {
            this.#database.run(
               sql,field_values, function(error) {
                  if(error) {
                     reject(error)
                  }
                  else {
                     resolve(this.lastID)
                  }
               }
            )
         }).catch((error) => this.set_last_error(error))
      
         if(result) {
            action_obj.id = result
            return {
               query:'create_actions_log',
               outcome:'success',
               action:action_obj
            }
         }
         else {
            let fail_response = {
               query:'create_actions_log',
               outcome:'fail',
               message:'There was an error attempting to create the action log record. [ActionsLog.create]  ' + this.#last_error.message
            }
            this.clear_last_error()
            return fail_response
         }
      }
   }


   //
   // DELETE
   // hard delete
   //
   async delete(id) {

      if(!Number.isInteger(parseInt(id))) {
         return {
            query:'delete_actions_log_record',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the actions log. The id was not matched.'
         } 
      }

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `DELETE FROM actions_log WHERE id = ?`,[id], function(error) {
               if(error) {
                  reject(error)
               }
               resolve(true)
            }
         )
      }).catch((error) => this.set_last_error(error))

      if(result) {
         return {
            query:'delete_actions_log_record',
            outcome:'success',
            message:'The actions log record was successfully and permanently deleted.'
         }
      }
      else {
         let fail_response = {
            query:'delete_actions_log_record',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the actions log record. [ActionsLog.delete]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
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



module.exports = ActionsLog