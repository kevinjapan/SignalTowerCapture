
const { get_sqlready_datetime,get_sqlready_date_from_js_date } = require('../app/utilities/datetime')
const {
   get_status_condition_sql,
   get_order_by_condition_sql
} = require('../app/utilities/search_utilities')


class Tag {

   #database

   #last_error

   // we limit number of possible tags (proliferation loses value of the system)
   #max_tags_count = 36

   // every read-all needs an absolute upper limit!
   #limit_read_all_records = this.#max_tags_count


   //
   // full_fields_list
   // Our methods return appropriate filtered arrays of eg 'field_names', and we build rows/forms/etc  
   // from these arrays in the renderer, so the order of this array is carried over to front-end views.
   //
   static #full_fields_list = [
      {key:'tag',sql:'TEXT NOT NULL',editable:true,export:true,test:{type:'string',min:3,max:50}},
      {key:'id',sql:'INTEGER PRIMARY KEY',export:true,test:{type:'int',min:1,max:9999999999}},
      {key:'created_at',sql:'TEXT NOT NULL',export:true,test:{type:'date',min:10,max:24}},
      {key:'updated_at',sql:'TEXT NOT NULL',export:true,test:{type:'date',min:10,max:24}},
      {key:'deleted_at',sql:'TEXT',export:true,test:{type:'date',min:10,max:24}},
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

   get_max_tags_count() {
      let copy = this.#max_tags_count
      return copy
   }


   //
   // READ ALL : Paginated
   //
   async read(context) {

      let total_count = 0  
      let sql

      // filters
      let status = 'tags.deleted_at IS NULL'
      let order_by = 'tag'
      if(context.filters) {
         status = get_status_condition_sql('tags',context.filters.record_status)
      }

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {
            
            sql = `SELECT COUNT(id) as count FROM tags WHERE ${status}`
            this.#database.get(sql, (error, rows) => {
               if(error) {
                  reject(error)
               }
               total_count = rows.count
            })

            const fields = Tag.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                     FROM tags 
                     WHERE ${status}
                     ORDER BY ${order_by}
                     COLLATE NOCASE
                     LIMIT ${this.#max_tags_count}`
            this.#database.all(sql, (error, rows) => {
               if(error) reject(error)
               resolve(rows)        
            })
         })
      }).catch((error) => this.set_last_error(error))
 

      // reduce fields to those required in CollectionItemCard (also requires 'type' for displaying dates)
      const in_card_fields = Tag.#full_fields_list
      
      if(result) {
         let response_obj = {
            query:'read_tags',
            outcome:'success',
            count:total_count,
            per_page:this.#max_tags_count,
            tag_fields:in_card_fields,
            tags:result
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_tags',
            outcome:'fail',
            message:'There was an error attempting to read the records. [Tag.read]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }


   //
   // READ ALL - non-paginated
   //
   // for generating csv file we want to extract all records,
   // future : we want to avoid performance issues with memory -
   // using db.all will put all records into memory, so use db.each and offsets to chunk load and write to file?
   //
   async read_all() {
      
      let total_count = 0 //this.count().count   
      let sql

      // filters
      let status = 'tags.deleted_at IS NULL'
      let order_by = 'title'
      if(context.filters) {
         status = get_status_condition_sql('tags',context.filters.record_status)
         order_by = get_order_by_condition_sql('tags',context.filters.order_by,context.filters.order_by_direction)
      }

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {
            
            sql = `SELECT COUNT(id) as count FROM tags WHERE ${status}`
            this.#database.get(sql, (error, rows) => {
               if(error) reject(error)
               total_count = rows.count           
            })

            const fields = Tag.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                     FROM tags 
                     WHERE ${status}
                     ORDER BY ${order_by}
                     LIMIT ${this.#limit_read_all_records}`
            this.#database.all(sql, (error, rows) => {
               if(error) reject(error)
               resolve(rows)            
            })
         })
      }).catch((error) => this.set_last_error(error))

      const exportable_fields = Tag.#full_fields_list.filter((field) => {
         if(field.export === true) return field
      })

      const fields = exportable_fields.map((field) => {
         return {
            key:field.key
         }
      })

      if(result) {
         let response_obj = {
            query:'read_tags',
            outcome:'success',
            count:total_count,
            tag_fields:fields,
            tags:result
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_tags',
            outcome:'fail',
            message:'There was an error attempting to read the records. [Tag.read]  ' + this.#last_error.message
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
            message:'There was an error attempting to read the record. '
         } 
      }
      
      const field_keys = Tag.#full_fields_list.map((field) => {
         return field.key
      })

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {
         this.#database.all(
            `SELECT ${field_keys} FROM tags WHERE id = ${id} LIMIT 100`,
            (error, rows) => {
               if(error) {
                  reject(error)
               }
               resolve(rows)            
            }
         )
      }).catch((error) => this.set_last_error(error))

      // const in_card_fields = this.#full_fields_list.filter((field) => {
      //    if(field.in_card === true) return field
      // })
      const fields = Tag.#full_fields_list.map((field) => {
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
            tag_fields:fields,
            tag:result[0]
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_single_tag',
            outcome:'fail',
            message:'There was an error attempting to read the record. [Tag.read_single] ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }



   //
   // CREATE
   // we rely on single inserts even for batch inserts since -
   // - the code w/ prepared statements becomes unclear with multiple inserts
   // - batch inserts is a seldom used feature
   async create(tag,editable_only = true) {
      

      let fields = Tag.#full_fields_list

      if(editable_only) {
         fields = fields.filter((field) => {
            if(field.editable === true) return field
         })
      }

      const field_keys = fields.map((field) => {
         return field.key
      })

      // build '?' string
      // const inserts = Array(fields.length).fill(0)
      const inserts = field_keys.map((field) => {
         return '?'
      })

      // build values list - eg ["bar",2] - & add id at end
      const field_values = fields.map((field) => {
         return tag[field.key]
      })

      let created_at = get_sqlready_datetime()

      const sql = `INSERT INTO tags(${field_keys.toString()},created_at,updated_at) 
                   VALUES(${inserts.toString()},'${created_at}','${created_at}')`

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
         tag.id = result
         return {
            query:'create_tag',
            outcome:'success',
            tag:tag
         }
      }
      else {
         let fail_response = {
            query:'create_tag',
            outcome:'fail',
            message:'There was an error attempting to create the record. [Tag.create]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }

   
   //
   // UPDATE
   //
   async update(tag,editable_only = true) {
      
      if(typeof tag.id === 'undefined' || !Number.isInteger(tag.id)) {
         return {
            query:'update_tag',
            outcome:'fail',
            message:'The record ID was missing or invalid.'
         }
      }

      let fields = Tag.#full_fields_list
      
      if(editable_only) {
         fields = fields.filter((field) => {
            if(field.editable === true) return field
         })
      }

      const field_keys = fields.map((field) => {
         return field.key
      })

      // build sql set assignments - eg 'title = ?,tagline = ?...'
      let sql_set_assign_placeholders = field_keys.map((field) => {
         return field + ' = ?'
      })

      let updated_at = get_sqlready_datetime()
      sql_set_assign_placeholders+= `, updated_at = "${updated_at}"`

      const sql = `UPDATE tags 
                   SET ${sql_set_assign_placeholders.toString()} 
                   WHERE id = ? `

      // build values list - eg ["bar",2] - & add id at end
      const field_values = fields.map((field) => {
         return tag[field.key]
      })

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            sql,
            [...field_values,tag.id], 
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
            query:'update_tag',
            outcome:'success',
            tag:tag
         }
      }
      else {
         let fail_response = {
            query:'update_tag',
            outcome:'fail',
            message:'There was an error updating the record. [Tag.update]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }

   
   //
   // DELETE (SOFT)
   // 
   async delete(id) {

      if(!Number.isInteger(parseInt(id))) {
         return {
            query:'delete_tag',
            outcome:'fail',
            message:'There was an error attempting to delete the record. The Record id was not matched.'
         } 
      }

      // we 'soft delete' and assign date to 'deleted_at' column
      let deleted_at = get_sqlready_datetime()

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `UPDATE tags SET deleted_at = ? WHERE id = ? `, [deleted_at,id], function(error) {
               if(error) {
                  reject(error)
               }
               resolve(true)
            }
         )
      }).catch((error) => this.set_last_error(error))

      if(result) {
         return {
            query:'delete_tag',
            outcome:'success',
            message: 'The record was successfully deleted.'
         }
      }
      else {
         let fail_response = {
            query:'delete_tag',
            outcome:'fail',
            message:'There was an error attempting to delete the record. [Tag.delete]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }

   }

   //
   // RESTORE (SOFT DELETED)
   // 
   async restore(id) {

      if(!Number.isInteger(parseInt(id))) {
         return {
            query:'restore_tag',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the record. The Record id was not matched.'
         } 
      }

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `UPDATE tags SET deleted_at = NULL WHERE id = ? `, [id], function(error) {
               if(error) {
                  reject(error)
               }
               resolve(true)
            }
         )
      }).catch((error) => this.set_last_error(error))

      if(result) {
         return {
            query:'restore_tag',
            outcome:'success',
            message: 'The record was successfully restored.'
         }
      }
      else {
         let fail_response = {
            query:'restore_tag',
            outcome:'fail',
            message:'There was an error attempting to restore the record. [Tag.restore]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }

   }
   

   //
   // HARD DELETE
   //
   async hard_delete(id) {
      
      if(!Number.isInteger(parseInt(id))) {
         return {
            query:'hard_delete_tag',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the record. The Record id was not matched.'
         } 
      }

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `DELETE FROM tags WHERE id = ?`,[id], function(error) {
               if(error) {
                  reject(error)
               }
               resolve(true)
            }
         )
      }).catch((error) => this.set_last_error(error))

      if(result) {
         return {
            query:'hard_delete_tag',
            outcome:'success',
            message:'The record was successfully and permanently deleted.'
         }
      }
      else {
         let fail_response = {
            query:'hard_delete_tag',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the record. [Tag.hard_delete]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }


   //
   // Flush all soft deleted items (permanent delete)
   //
   async flush_deleted(cut_off_date) {

      let str_date = get_sqlready_date_from_js_date(cut_off_date)
      console.log(' > Permanently deleting all records soft deleted before',str_date)

      // verify date
      try {
         is_valid_date(str_date)
      }
      catch(e) {
         return {
            query:'flush_deleted',
            outcome:'success',
            message:e
         }
      }
      
      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `DELETE FROM tags WHERE deleted_at IS NOT NULL AND deleted_at < ?`,[str_date], function(error) {
               if(error) {
                  reject(error)
               }
               resolve(true)
            }
         )
      }).catch((error) => this.set_last_error(error))

      // return result
      if(result) {
         return {
            query:'flush_deleted',
            outcome:'success',
            message:'The records were successfully and permanently deleted.'
         }
      }
      else {
         let fail_response = {
            query:'flush_deleted',
            outcome:'fail',
            message:'There was an error attempting to permanently delete multiple records. [Tag.flush_deleted]  ' + this.#last_error.message
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



module.exports = Tag