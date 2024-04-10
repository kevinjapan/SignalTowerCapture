const { dirname } = require('node:path')
const { get_sqlready_datetime } = require('../app/utilities/datetime')
const { get_random_int } = require('../app/utilities/utilities')
const { DESC } = require('../app/utilities/descriptions')


// to do : complete adaption from AppConfig Class

// ActionsLog matches batches of records to actions performed at specific times
//
// eg
// action		   start_at	   end_at
// ----------------------------------------------------------------------------------------------
// import_csv	   11:14		   11:20			we can use to rollback (remove) imported records
// import_json	   4:50		   4:55
// delete		   7:12		   7:12			we can use to rollback (undelete) batch deleted records
//

// to do :
// - add import history (after log import actions above)
//   - can rollback (use time start and end of process to delete records)
//   - save to log database table (?)
//     - action  (we can name eg imports by their timestamp)
//     - start time   
//     - end time
//   - we need to manage queue here - on adding a specific 'action' log record, if current queue > 10, delete oldest log record of that 'action'
//   - log for 'type' of import [csv/json/..]

class ActionsLog {

   #database

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
   // READ ALL : 
   // Not paginated since we limit all logs to last 20 actions (queue)
   // 
   async read() {

      // to do : 
   }


   async read_all() {

      // to do : 
   }



   //
   // READ SINGLE
   //
   async read_single() {

      const fields = ActionsLog.#full_fields_list.map((field) => {
         return field.key
      })

      // wrap in a promise to await result
      let result = await new Promise((resolve,reject) => {
         this.#database.all(
            `SELECT ${fields} FROM actions_log LIMIT 1`,
            (error, rows) => {
               if(error) {
                  reject(error)
               }
               resolve(rows)            
            }
         )
      }).catch((error) => this.set_last_error(error))


      const field_names = ActionsLog.#full_fields_list.map((field) => {
         return field.key
      })

      // if no rows found, actions_log hasn't been initialized // to do : ...
      if(result.length < 1) {
         result = false
      }
      
      if(result) {
         let response_obj = {
            query:'read_single_actions_log',
            outcome:'success',
            actions_log_fields:field_names,
            actions_log:result[0]
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_single_actions_log',
            outcome:'fail',
            message:'There was an error attempting to read the Actions Log. [ActionsLog.read_single] '
         }
         return fail_response
      }
   }

   //
   // CREATE
   //
   async create(collection_item,editable_only = true) {

      // to do : 
   }


   //
   // UPDATE
   //
   async update(actions_log_record) {

      // to do : 
   }
   

   //
   // DELETE
   // hard delete
   //
   async delete(id) {

      // to do : 
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