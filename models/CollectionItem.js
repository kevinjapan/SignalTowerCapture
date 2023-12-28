const sqlite3 = require('sqlite3').verbose()
const { get_sqlready_datetime,get_sqlready_date_from_js_date } = require('../app/utilities/datetime')
const { is_valid_date } = require('../app/utilities/validation')
const { 
   MIN_SEARCH_TERM_LEN,
   get_status_condition,
   tokenize_search_term,
   remove_stopwords 
} = require('../app/utilities/search_utilities')



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
      {key:'title',sql:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:3,max:100}},
      {key:'file_name',sql:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:5,max:255}},
      {key:'parent_folder_path',sql:'TEXT NOT NULL',editable:true,in_card:false,export:true,test:{type:'string',min:1,max:255}},
      {key:'id',sql:'INTEGER PRIMARY KEY',editable:false,in_card:false,export:true,test:{type:'int',min:1,max:9999999999}},
      {key:'item_ref',sql:'INTEGER',editable:true,in_card:false,export:true,test:{type:'string',min:1,max:100}},
      {key:'item_date',sql:'TEXT',editable:true,in_card:true,export:true,test:{type:'date',min:0,max:24},placeholder:'YYYY-MM-DD'},
      {key:'item_type',sql:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:3,max:50}},
      {key:'author_creator',sql:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:200}},
      {key:'people_protagonists',sql:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:500}},
      {key:'source',sql:'TEXT',editable:true,in_card:true,export:true,test:{type:'string',min:0,max:120}},
      {key:'content_desc',sql:'TEXT',editable:true,in_card:true,export:true,test:{type:'string',min:0,max:1200}},
      {key:'content_pages_count',sql:'INTEGER',editable:true,in_card:false,export:true,test:{type:'int',min:0,max:200}},
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
   async read(context) {

      const record_status = context.record_status ? context.record_status : ''
      let offset = (parseInt(context.page) - 1) * this.#items_per_page
      let total_count = 0  
      let sql

      let status = `collection_items.deleted_at IS NULL`
      if(record_status === 'DELETED') {
         status = `collection_items.deleted_at IS NOT NULL`
      }
      if(record_status === 'ALL') {
         status = ``
      }

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {
            
            sql = `SELECT COUNT(id) as count FROM collection_items WHERE ${status}`
            this.#database.get(sql, (error, rows) => {
               if(error) reject(error)
               total_count = rows.count           
            })

            const fields = CollectionItem.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                     FROM collection_items 
                     WHERE ${status}
                     LIMIT ${this.#items_per_page} 
                     OFFSET ${offset}`
            this.#database.all(sql, (error, rows) => {
               if(error) reject(error)
               resolve(rows)            
            })
         })
      }).catch((error) => this.set_last_error(error))
 

      // reduce fields to those required in CollectionItemCard (also requires 'type' for displaying dates)
      const in_card_fields = this.get_in_card_fields(CollectionItem.#full_fields_list)

      
      if(result) {
         let response_obj = {
            query:'read_collection_items',
            outcome:'success',
            count:total_count,
            per_page:this.#items_per_page,
            collection_item_fields:in_card_fields,
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
   // we rely on single inserts even for batch inserts since -
   // - the code w/ prepared statements becomes unclear with multiple inserts
   // - batch inserts is a seldom used feature
   async create(collection_item,editable_only = true) {

      let fields = CollectionItem.#full_fields_list

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
   async update(collection_item,editable_only = true) {
      
      if(typeof collection_item.id === 'undefined' || !Number.isInteger(collection_item.id)) {
         return {
            query:'update_collection_item',
            outcome:'fail',
            message:'The record ID was missing or invalid.'
         }
      }

      let fields = CollectionItem.#full_fields_list
      
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
            query:'delete_collection_item',
            outcome:'fail',
            message:'There was an error attempting to delete the record. The Record id was not matched.'
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
            message: 'The record was successfully deleted.'
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
   // RESTORE (SOFT DELETED)
   // 
   async restore(id) {

      if(!Number.isInteger(parseInt(id))) {
         return {
            query:'restore_collection_item',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the record. The Record id was not matched.'
         } 
      }

      const result = await new Promise((resolve,reject) => {
         this.#database.run(
            `UPDATE collection_items SET deleted_at = NULL WHERE id = ? `, [id], function(error) {
               if(error) {
                  reject(error)
               }
               resolve(true)
            }
         )
      }).catch((error) => this.set_last_error(error))

      if(result) {
         return {
            query:'restore_collection_item',
            outcome:'success',
            message: 'The record was successfully restored.'
         }
      }
      else {
         let fail_response = {
            query:'restore_collection_item',
            outcome:'fail',
            message:'There was an error attempting to restore the record. [CollectionItem.restore]  ' + this.#last_error.message
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
            query:'hard_delete_collection_item',
            outcome:'fail',
            message:'There was an error attempting to permanently delete the record. The Record id was not matched.'
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
            `DELETE FROM collection_items WHERE deleted_at IS NOT NULL AND deleted_at < ?`,[str_date], function(error) {
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
            message:'There was an error attempting to permanently delete multiple records. [CollectionItem.flush_deleted]  ' + this.#last_error.message
         }
         this.clear_last_error()
         return fail_response
      }
   }



   //
   // SEARCH
   // sql search 
   // we use 'INSTR' and '||' instead of 'LIKE ?' - easier to manage columns / removes using inefficient 'OR's / removes % wildcard (cleaner)
   //
   async search(search_obj) {

      // pagination
      let offset = (parseInt(search_obj.page) - 1) * this.#items_per_page

      // execution time
      let execution_time = 0
      const start = Date.now()

      // record status - show [active|deleted|all] records
      let status = get_status_condition(search_obj.record_status)

      // process search_term
      let full_search_term = search_obj.search_term.trim()
      if(full_search_term.length < MIN_SEARCH_TERM_LEN) {  
         return {
            query:'search_collection_items',
            outcome:'fail',
            message:'The search term you entered has too few characters - please enter 3 or more characters.'
         }
      }

      // package search_term into valid search token(s) array
      let search_term_tokens = tokenize_search_term(full_search_term)

      // exlude common words from our searches
      let filtered_search_term_tokens = remove_stopwords(search_term_tokens)

      // build sql INSTR functions
      let instr_funcs = this.build_instr_funcs_sql(filtered_search_term_tokens)


      // get total count
      const total_count = await new Promise((resolve,reject) => {
         
         const count_query = `SELECT COUNT(DISTINCT id) as count 
                              FROM collection_items 
                              WHERE
                                 ${instr_funcs} > 0
                              AND ${status}`
         let stmt = this.#database.prepare(count_query,(err) => {
            if(err) reject(err)
         })
         stmt.each(filtered_search_term_tokens, function(err, row) {
            if(err) reject(err)
            stmt.finalize()
            resolve(row.count)
         })
      }).catch((error) => {
         this.set_last_error(error)
         return false
      })

      
      // execute the search
      let search_result = null
      
      if(total_count) {

         search_result = await new Promise((resolve,reject) => {
            
               const fields = CollectionItem.#full_fields_list.map((field) => {
                  return field.key
               })
               
               // get results dataset (paginated by offset)
               const search_query = `SELECT ${fields.toString()}
                     FROM collection_items 
                     WHERE 
                        ${instr_funcs} > 0               
                     AND 
                        ${status}
                     LIMIT ${this.#items_per_page}
                     OFFSET ${offset}`

               this.#database.all(search_query,filtered_search_term_tokens, (error, rows) => {
                  if(error) {
                     this.set_last_error(error)
                     reject(error)
                  }
                  resolve(rows)            
               })

         }).catch((error) => {
            this.set_last_error(error)
            return false
         })
      }
            
      // calc execution time
      const end = Date.now()
      execution_time = `${(end - start) / 1000} seconds`

      // reduce fields to those required in CollectionItemCard (inc 'type' for displaying dates)
      const in_card_fields = this.get_in_card_fields(CollectionItem.#full_fields_list)
      
      // response
      if(search_result || search_result === null) {
         return {
            query:'search_collection_items',
            outcome:'success',
            search_obj:search_obj,
            count:total_count,
            per_page:this.#items_per_page,
            execution_time:execution_time,
            collection_item_fields:in_card_fields,
            collection_items:result
         }
      }
      
      let response = {
         query:'search_collection_items',
         outcome:'fail',
         message:'There was an error accessing the database. [CollectionItem.search] ' + this.#last_error.message
      }
      this.clear_last_error()
      return response
   
   }


   
   //
   // FULL TEXT SEARCH
   // sql search using fts5 extension
   // dependency: virtual table / triggers
   // future: do we need to remove stopwords - see search()
   //
   // future : to vary search cols at user request - can modify MATCH term to limit cols -
   //     eg   ci_fts MATCH 'title: eland';
   //          ci_fts MATCH '{title content_desc}:eland';
   //
   async search_fts(search_obj) {
      
      // pagination
      let offset = (parseInt(search_obj.page) - 1) * this.#items_per_page

      // execution time
      let execution_time = 0
      const start = Date.now()

      // record status - show [active|deleted|all] records
      let status = get_status_condition(search_obj.record_status)

      // process search_term
      let full_search_term = search_obj.search_term.trim()
      if(full_search_term.length < MIN_SEARCH_TERM_LEN) {  
         return {
            query:'search_collection_items',
            outcome:'fail',
            message:'The search term you entered has too few characters - please enter 3 or more characters.'
         }
      }

      // get total count
      const total_count = await new Promise((resolve,reject) => {

         const count_query = `SELECT 
                                 COUNT(collection_items.id) as count 
                              FROM collection_items
                                 INNER JOIN collection_items_fts ci_fts
                                 ON ci_fts.id = collection_items.id
                              WHERE
                                 collection_items_fts MATCH ?
                              AND 
                                 ${status}`
         let stmt = this.#database.prepare(count_query,(err) => {
            if(err) reject(err)
         })
         stmt.each(`${full_search_term}*`, (err, row) => {
            if(err) reject(err)
            stmt.finalize()
            resolve(row.count)
         })
      }).catch((error) => {
         this.set_last_error(error)
         return false
      })


      // execute the search
      let search_result = null
         
      // to do : review - if total count is 0 ?
      // also, good efficiency - we could prevent needless search execution ;)  rollout to search() above

      console.log('total_count',total_count)
      
      if(total_count) {

         search_result = await new Promise((resolve,reject) => {
            
            const fields = CollectionItem.#full_fields_list.map((field) => {
               return `collection_items.${field.key}`
            })

            // get results dataset (paginated by offset)
            // we order using bm25() rather than 'rank' col to permit weighting cols.
            const search_query = `
                  SELECT
                     ${fields.toString()}
                  FROM collection_items
                     INNER JOIN collection_items_fts ci_fts
                     ON ci_fts.id = collection_items.id
                  WHERE 
                     collection_items_fts MATCH ?
                  AND 
                     ${status}
                  ORDER BY
                     bm25(collection_items_fts,0,10,2)
                  LIMIT ${this.#items_per_page}
                  OFFSET ${offset}`

            this.#database.all(search_query,`${full_search_term}*`, (error, rows) => {
               if(error) {
                  this.set_last_error(error)
                  reject(error)
               }
               resolve(rows)            
            })
         }).catch((error) => {
            this.set_last_error(error)
            return false
         })
      }

      // calc execution time
      const end = Date.now()
      execution_time = `${(end - start) / 1000} seconds`

      // reduce fields to those required in CollectionItemCard (inc 'type' for displaying dates)
      const in_card_fields = this.get_in_card_fields(CollectionItem.#full_fields_list)

      // response
      if(search_result || search_result === null) {
         return {
            query:'search_collection_items',
            outcome:'success',
            search_obj:search_obj,
            count:total_count,
            per_page:this.#items_per_page,
            execution_time:execution_time,
            collection_item_fields:in_card_fields,
            collection_items:search_result
         }
      }

      let response =  {
         query:'search_collection_items',
         outcome:'fail',
         message:'There was an error accessing the database. [CollectionItem.search_fts] ' + this.#last_error.message
      }
      this.clear_last_error()
      return response
   }


   //
   // filter to those fields required in CollectionItemCard display
   //
   get_in_card_fields = (fields) => {
      const temp = fields.filter((field) => {
         if(field.in_card === true) return field
      })
      return temp.map((field) => {
         return {
            key:field.key,
            test:field.test
         }
      })
   }


   //
   // Dynamically build the INSTR sql constuct for our search tokens
   // future : the list of cols here are the fields we search against - improve/review
   //
   build_instr_funcs_sql = (tokens) => {

      let sql = ''
      for(let i in tokens) {
         sql += ` INSTR( title || content_desc , ? ) +`
      }
      return sql.slice(0,-1)

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