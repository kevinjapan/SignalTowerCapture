const { dirname } = require('node:path')
const { get_sqlready_datetime } = require('../app/utilities/datetime')
const { get_random_int } = require('../app/utilities/utilities')
const { DESC } = require('../app/utilities/descriptions')

const { get_status_condition_sql } = require('../app/utilities/search_utilities')


// ActionsLog matches batches of records to actions performed at specific times
// simply by recording the start and end of time of the action
// We can then perform rollbacks on records created|deleted/.. in that window.


// to do :
// ActionsLog
// - implement ActionsLog model (as a queue for each 'action')
// - enable 'rollback' on ActionsLog


class ActionsLog {

   #database

   // log is a queue for each action type (FIFO)
   #max_queue_count = 10

   // every read-all needs an absolute upper limit!
   #limit_read_all_records = this.#max_queue_count

   #last_error

   //
   // full_fields_list
   //
   static #full_fields_list = [
      {key:'id',data_type:'INTEGER PRIMARY KEY',in_card:true,test:{type:'int',min:1,max:9999999999}},
      {key:'action',data_type:'TEXT',test:{type:'string',min:1,max:60}},
      {key:'file',data_type:'TEXT',test:{type:'string',min:0,max:120}},
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
   // 
   async read(context) {

      let total_count = 0  
      let sql

      // filters target known specific conditional tests
      let action = 'action IS NULL'   // our default 'WHERE' clause
      let limit = this.#max_queue_count
      let offset = 0
       if(context.filters) {
         if(context.filters.action) action = `action = "${context.filters.action}"`
         if(context.filters.limit) limit = context.filters.limit
         if(context.filters.offset) offset = context.filters.offset
      }

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {

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

            sql = `SELECT ${fields.toString()} FROM actions_log 
                     WHERE ${action}                     
                     ORDER BY created_at DESC
                     LIMIT ${limit}
                     OFFSET ${offset}`

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

            sql = `SELECT ${fields.toString()} FROM actions_log 
                     WHERE ${action}
                     ORDER BY ${order_by}
                     LIMIT ${this.#limit_read_all_records}`
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
   async read_single(id) {

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

      // we use count to manage queue
      // verify we are not exceeding specific action type queue len
      // to do : move action in sql to placeholder parameter
      const count = await new Promise((resolve,reject) => {
         sql = `SELECT COUNT(id) as count FROM actions_log WHERE action = "${action_obj.action}"`
         this.#database.get(sql, (error, rows) => {
            if(error) {
               reject(error)
            }
            if(rows) resolve(rows.count)
         })
      }).catch((error) => {
         console.log('ERR',error)   // to do : handle and notify better
         this.set_last_error(error)
      })

      // manage action type queue
      if(count >= this.#max_queue_count) {
         
         // manage fifo queue
         // get 'id' of record at 'bottom' of queue (oldest record, so lowest 'id' value) 
         // delete all records w/ lower 'id' (and matching 'action')

         // get record at 'bottom'
         let context = {
            filters:{
               action:action_obj.action,
               offset:10,
               limit:1
            }
         }
         const record = await this.read(context)

         // delete that record and all records older
         if(record) {
            const last_valid_record_id = record.actions[0].id
            const del_context = {
               key:'delete_actions_log_record',
               filters:{
                  action:action_obj.action,
                  test:'<'
               }
            }
            const delete_result = await this.delete(last_valid_record_id,del_context)
            console.log('delete_result',delete_result)
         }
      }
      
      // create new ActionsLog record
      // will not add if queue management above hasn't been successful
      // to do : only proceed if delete_result is successful
      //if(count < this.#max_queue_count) {

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
      //}
   }


   //
   // DELETE
   // hard delete
   //
   async delete(id,context = {}) {

      if(!Number.isInteger(parseInt(id))) {
         return {
            query:'delete_actions_log_record',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the actions log. The id was not matched.'
         } 
      }

      let id_clause = 'id = ?'   // our default 'WHERE' clause
      let action = ''
       if(context.filters) {
         if(context.filters.test) id_clause = `id ${context.filters.test} ?`
         if(context.filters.action) action = `AND action = "${context.filters.action}"`
      }

      console.log('delete sql',`DELETE FROM actions_log WHERE ${id_clause} ${action}`)
      console.log('id',id)

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `DELETE FROM actions_log WHERE ${id_clause} ${action}`,[id], function(error) {
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