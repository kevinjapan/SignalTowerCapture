const sqlite3 = require('sqlite3').verbose()
const { get_sqlready_datetime } = require('../app/utilities/datetime')



class CollectionItem {

   #database

   #last_error

   #items_per_page = 20

   // every read-all needs an absolute upper limit!
   // future : permit limitless w/ batches
   #limit_read_all_records = 20000


   //
   // full_fields_list
   // Our methods return appropriate filtered arrays of eg 'field_names', and we build rows/forms/etc  
   // from these arrays in the renderer, so the order of this array is carried over to front-end views.
   //
   static #full_fields_list = [
      {key:'file_name',sql:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:5,max:255}},
      {key:'parent_folder_path',sql:'TEXT NOT NULL',editable:true,in_card:false,export:true,test:{type:'string',min:1,max:255}},
      {key:'id',sql:'INTEGER PRIMARY KEY',editable:false,in_card:false,export:true,test:{type:'int',min:1,max:9999999999}},
      {key:'title',sql:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:3,max:100}},
      {key:'item_ref',sql:'INTEGER',editable:true,in_card:false,export:true,test:{type:'string',min:1,max:100}},
      {key:'item_date',sql:'TEXT',editable:true,in_card:true,export:true,test:{type:'date',min:0,max:24},placeholder:'YYYY-MM-DD'},
      {key:'item_type',sql:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:3,max:50}},
      {key:'author_creator',sql:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:200}},
      {key:'people_protagonists',sql:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:500}},
      {key:'source',sql:'TEXT',editable:true,in_card:true,export:true,test:{type:'string',min:0,max:120}},
      {key:'content_desc',sql:'TEXT',editable:true,in_card:true,export:true,test:{type:'string',min:0,max:1200}},
      {key:'content_pages_count',sql:'INTEGER',editable:true,in_card:false,export:true,test:{type:'int',min:0,max:200}},
      {key:'additional_fields',sql:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:2000}},
      {key:'bookmarked_at',sql:'TEXT',editable:false,in_card:false,export:true,test:{type:'date',min:10,max:24}},
      {key:'created_at',sql:'TEXT NOT NULL',editable:false,in_card:false,export:true,test:{type:'date',min:10,max:24}},
      {key:'updated_at',sql:'TEXT NOT NULL',editable:false,in_card:false,export:true,test:{type:'date',min:10,max:24}},
      {key:'deleted_at',sql:'TEXT',editable:false,in_card:false,export:true,test:{type:'date',min:10,max:24}},
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
   // READ ALL : Paginated
   //
   async read(page = 1) {
     
         let offset = (parseInt(page) - 1) * this.#items_per_page
         let total_count = 0 //this.count().count   
         let sql

         // wrap in a promise to await result
         const result = await new Promise((resolve,reject) => {

            this.#database.serialize(() => {
               
               sql = `SELECT COUNT(id) as count FROM collection_items`
               this.#database.get(sql, (error, rows) => {
                  if(error) reject(error)
                  total_count = rows.count           
               })

               const fields = CollectionItem.#full_fields_list.map((field) => {
                  return field.key
               })

               sql = `SELECT ${fields.toString()} 
                      FROM collection_items 
                      LIMIT ${this.#items_per_page} 
                      OFFSET ${offset}`
               this.#database.all(sql, (error, rows) => {
                  if(error) reject(error)
                  resolve(rows)            
               })
            })
         }).catch((error) => this.set_last_error(error))
 
         
      const in_card_fields = CollectionItem.#full_fields_list.filter((field) => {
         if(field.in_card === true) return field
      })
      const fields = in_card_fields.map((field) => {
         return {
            key:field.key,
            test:field.test
         }
      })
      
      if(result) {
         let response_obj = {
            query:'read_collection_items',
            outcome:'success',
            count:total_count,
            per_page:this.#items_per_page,
            collection_item_fields:fields,
            collection_items:result
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_collection_items',
            outcome:'fail',
            message:'There was an error attempting to read the records. [CollectionItem.read]  ' + this.#last_error.message
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

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {
            
            sql = `SELECT COUNT(id) as count FROM collection_items`
            this.#database.get(sql, (error, rows) => {
               if(error) reject(error)
               total_count = rows.count           
            })

            const fields = CollectionItem.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                   FROM collection_items 
                   LIMIT ${this.#limit_read_all_records}`
            this.#database.all(sql, (error, rows) => {
               if(error) reject(error)
               resolve(rows)            
            })
         })
      }).catch((error) => this.set_last_error(error))

      const exportable_fields = CollectionItem.#full_fields_list.filter((field) => {
         if(field.export === true) return field
      })

      const fields = exportable_fields.map((field) => {
         return {
            key:field.key
         }
      })

      if(result) {
         let response_obj = {
            query:'read_collection_items',
            outcome:'success',
            count:total_count,
            collection_item_fields:fields,
            collection_items:result
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_collection_items',
            outcome:'fail',
            message:'There was an error attempting to read the records. [CollectionItem.read]  ' + this.#last_error.message
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
      
      const field_keys = CollectionItem.#full_fields_list.map((field) => {
         return field.key
      })

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {
         this.#database.all(
            `SELECT ${field_keys} FROM collection_items WHERE id = ${id} LIMIT 100`,
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
      const fields = CollectionItem.#full_fields_list.map((field) => {
         return {
            key:field.key,
            editable:field.editable,
            test:field.test
         }
      })
      
      if(result) {
         let response_obj = {
            query:'read_single_collection_item',
            outcome:'success',
            collection_item_fields:fields,
            collection_item:result[0]
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_single_collection_item',
            outcome:'fail',
            message:'There was an error attempting to read the record. [CollectionItem.read_single] ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }



   //
   // CREATE
   //
   async create(collection_item) {
      
      const fields = CollectionItem.#full_fields_list.filter((field) => {
         if(field.editable === true) return field
      })
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
         return collection_item[field.key]
      })

      let created_at = get_sqlready_datetime()

      const sql = `INSERT INTO collection_items(${field_keys.toString()},created_at,updated_at) 
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
         collection_item.id = result
         return {
            query:'create_collection_item',
            outcome:'success',
            collection_item:collection_item
         }
      }
      else {
         let fail_response = {
            query:'create_collection_item',
            outcome:'fail',
            message:'There was an error attempting to create the record. [CollectionItem.create]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }

   
   //
   // UPDATE
   //
   async update(collection_item) {
      
      if(typeof collection_item.id === 'undefined' || !Number.isInteger(collection_item.id)) {
         return {
            query:'update_collection_item',
            outcome:'fail',
            message:'The record ID was missing or invalid.'
         }
      }

      const fields = CollectionItem.#full_fields_list.filter((field) => {
         if(field.editable === true) return field
      })
      const field_keys = fields.map((field) => {
         return field.key
      })

      // build sql set assignments - eg 'title = ?,tagline = ?...'
      let sql_set_assign_placeholders = field_keys.map((field) => {
         return field + ' = ?'
      })

      let updated_at = get_sqlready_datetime()
      sql_set_assign_placeholders+= `, updated_at = "${updated_at}"`

      const sql = `UPDATE collection_items 
                   SET ${sql_set_assign_placeholders.toString()} 
                   WHERE id = ? `

      // build values list - eg ["bar",2] - & add id at end
      const field_values = fields.map((field) => {
         return collection_item[field.key]
      })

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            sql,
            [...field_values,collection_item.id], 
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
            query:'update_collection_item',
            outcome:'success',
            collection_item:collection_item
         }
      }
      else {
         let fail_response = {
            query:'update_collection_item',
            outcome:'fail',
            message:'There was an error updating the record. [CollectionItem.update]  ' + this.#last_error.message
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
            outcome:'fail',
            message:'There was an error attempting to permanently delete the record. '
         } 
      }

      // we 'soft delete' and assign date to 'deleted_at' column
      let deleted_at = get_sqlready_datetime()

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `UPDATE collection_items SET deleted_at = ? WHERE id = ? `, [deleted_at,id], function(error) {
               if(error) {
                  reject(error)
               }
               resolve(true)
            }
         )
      }).catch((error) => this.set_last_error(error))

      if(result) {
         return {
            query:'delete_collection_item',
            outcome:'success',
            message: 'The record was successfully deleted. This action is reversible.'
         }
      }
      else {
         let fail_response = {
            query:'delete_collection_item',
            outcome:'fail',
            message:'There was an error attempting to delete the record. [CollectionItem.delete]  ' + this.#last_error.message
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
            outcome:'fail',
            message:'There was an error attempting to permanently delete the record. '
         } 
      }

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `DELETE FROM collection_items WHERE id = ?`,[id], function(error) {
               if(error) {
                  reject(error)
               }
               resolve(true)
            }
         )
      }).catch((error) => this.set_last_error(error))

      if(result) {
         return {
            query:'hard_delete_collection_item',
            outcome:'success',
            message:'The record was successfully and permanently deleted.'
         }
      }
      else {
         let fail_response = {
            query:'hard_delete_collection_item',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the record. [CollectionItem.hard_delete]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }


   //
   // SEARCH
   //
   async search(search_obj) {

      let offset = (parseInt(search_obj.page) - 1) * this.#items_per_page
      let total_count = 0 //this.count().count 
      let sql

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {
         
         this.#database.serialize(() => {
               
            let stmt = this.#database.prepare("SELECT COUNT(id) as count FROM collection_items WHERE title LIKE ?");
            stmt.each(`%${search_obj.search_term}%`, function(err, row) {
                total_count=row.count
            }, function(err, count) {
                stmt.finalize()
            })

            const fields = CollectionItem.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                   FROM collection_items 
                   WHERE title LIKE ?
                   LIMIT ${this.#items_per_page}
                   OFFSET ${offset}`
            this.#database.all(sql,`%${search_obj.search_term}%`, (error, rows) => {
               if(error) reject(error)
               resolve(rows)            
            })
         })
      }).catch((error) => this.set_last_error(error))

      let search_results_obj
       
      const in_card_fields = CollectionItem.#full_fields_list.filter((field) => {
         if(field.in_card === true) return field
      })
      const fields = in_card_fields.map((field) => {
         return {
            key:field.key,
            test:field.test
         }
      })
      
      if(result) {
         search_results_obj = {
            query:'search_collection_items',
            outcome:'success',
            search_obj:search_obj,
            count:total_count,
            per_page:this.#items_per_page,
            collection_item_fields:fields,
            collection_items:result
         }
         return search_results_obj
      }
      else {         
         search_results_obj = {
            query:'search_collection_items',
            outcome:'fail',
            message:'There was an error accessing the database. [CollectionItem.search] ' + this.#last_error.message
         }
         this.clear_last_error()
         return search_results_obj
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



module.exports = CollectionItem