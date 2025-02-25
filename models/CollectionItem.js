const CollectionItemFTS = require('./CollectionItemFTS')
const { get_sqlready_datetime,get_sqlready_date_from_js_date } = require('../app/utilities/datetime')
const { is_valid_date } = require('../app/utilities/validation')
const { trim_char } = require('../app/utilities/strings')
const { assoc_arr_obj,title_from_file_name } = require('../app/utilities/utilities')
const { 
   SEARCH_FIELDS,
   MIN_SEARCH_TERM_LEN,
   get_status_condition_sql,
   get_order_by_condition_sql,
   tokenize_search_term,
   remove_stopwords
} = require('../app/utilities/search_utilities')


class CollectionItem {

   #database

   #last_error

   // we are balancing the large image size downloads w/ UX
   #items_per_page = 20

   // every read-all needs an absolute upper limit!
   #limit_read_all_records = 20000

   // full_fields_list
   // Our methods return appropriate filtered arrays of eg 'field_names', and we build rows/forms/etc  
   // from these arrays in the renderer, so the order of this array is carried over to front-end views.
   // Some test values are undesirable (eg title string len min:1) but required for legacy files.
   static #full_fields_list = [
      {key:'title',data_type:'TEXT NOT NULL',editable:true,injectable:true,in_card:true,export:true,test:{type:'string',min:1,max:100}},
      {key:'content_desc',data_type:'TEXT',editable:true,injectable:true,in_card:true,export:true,test:{type:'string',min:0,max:500}},
      {key:'file_type',data_type:'TEXT NOT NULL',editable:true,injectable:true,in_card:true,hidden:true,export:true,test:{type:'string',min:3,max:20}},
      {key:'file_name',data_type:'TEXT NOT NULL',editable:true,injectable:true,readonly:true,in_card:true,required_json:true,export:true,test:{type:'string',min:5,max:100}},
      {key:'folder_path',data_type:'TEXT',editable:true,injectable:true,readonly:true,in_card:true,required_json:true,export:true,test:{type:'string',min:0,max:200}},
      {key:'img_desc',data_type:'TEXT DEFAULT "image"',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:80}},
      {key:'item_ref',data_type:'TEXT',editable:true,injectable:true,in_card:false,export:true,test:{type:'string',min:0,max:100}},
      {key:'item_date',data_type:'TEXT',editable:true,injectable:true,in_card:true,export:true,test:{type:'date',min:0,max:10},placeholder:'YYYY-MM-DD'},
      {key:'item_type',data_type:'TEXT',editable:true,injectable:true,in_card:false,export:true,test:{type:'string',min:0,max:50}},
      {key:'author_creator',data_type:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:60}},
      {key:'people',data_type:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:100}},
      {key:'source',data_type:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:100}},
      {key:'tags',data_type:'TEXT',editable:true,in_card:false,hidden:true,export:true,test:{type:'string',min:0,max:200}},
      {key:'id',data_type:'INTEGER PRIMARY KEY',editable:false,in_card:false,export:true,test:{type:'int',min:1,max:9999999999}},
      {key:'created_at',data_type:'TEXT NOT NULL',editable:false,in_card:false,export:true,test:{type:'date',min:10,max:24}},
      {key:'updated_at',data_type:'TEXT NOT NULL',editable:false,in_card:false,export:true,test:{type:'date',min:10,max:24}},
      {key:'deleted_at',data_type:'TEXT',editable:false,in_card:false,export:true,test:{type:'date',min:10,max:24}},
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
   // READ : Paginated
   // set context.page -> -1 to switch off pagination
   //
   async read(context) {

      let sql
      let total_count = 0
      let offset_clause = ''

      if(context.page && context.page > 0) {
         const offset = (parseInt(context.page) - 1) * this.#items_per_page
         offset_clause = `OFFSET ${offset}`
      }

      // filters target known specific conditional tests (not limited to WHERE clause)
      let status = 'collection_items.deleted_at IS NULL'    // our default 'WHERE' clause (always present or overwritten below)
      let order_by = 'title COLLATE NOCASE ASC'             // our default 'ORDER BY' clause
      let filter_by_char = ''                               // where 'title' starts with _char 
      if(context.filters) {
         let { record_status,order_by,order_by_direction,filter_char } = context.filters
         if(record_status) status = get_status_condition_sql('collection_items',record_status)
         if(order_by) order_by = get_order_by_condition_sql('collection_items',order_by,order_by_direction)
         if(filter_char) filter_by_char = ` AND title LIKE '${filter_char}%' `
      }

      // field_filters target conditional tests against fields/cols within the record
      let field_filters_sql = ''
      if(context.field_filters && Array.isArray(context.field_filters)) {         
         context.field_filters.forEach(filter => {
            let value = trim_char(filter.value,',')
            if(filter.test) {
               switch(filter.test.toUpperCase()) {
                  case 'IN':
                     field_filters_sql += ` AND ${filter.field} IN (${value})`
                     break
                  case 'LIKE':
                     field_filters_sql += ` AND ${filter.field} LIKE "%${value}%"`
                     break
                  default:
                     field_filters_sql += ` AND ${filter.field} = "${value}"`
               }
            }
            else {
               field_filters_sql += ` AND ${filter.field} = "${value}"`
            }
         })
      }

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {
            
            sql = `SELECT COUNT(id) as count FROM collection_items WHERE ${status} ${filter_by_char} ${field_filters_sql}`
            this.#database.get(sql, (error, rows) => {
               if(error) reject(error)
               if(rows) total_count = rows.count           
            })

            const fields = CollectionItem.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                     FROM collection_items 
                     WHERE ${status} ${filter_by_char} ${field_filters_sql} 
                     ORDER BY ${order_by}                      
                     LIMIT ${this.#items_per_page}
                     ${offset_clause}`

            this.#database.all(sql, (error, rows) => {
               if(error) reject(error)
               if(rows) {
                  resolve(rows)
               } 
            })
         })
      }).catch((error) => {
         this.set_last_error(error)
         return false
      })
 
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
   // for generating csv file we want to extract all records,
   // we want to avoid performance issues with memory -
   // using db.all will put all records into memory, so use db.each and offsets to chunk load and write to file?
   //
   async read_all() {
      
      let total_count = 0  
      let sql

      // filters
      let status = 'collection_items.deleted_at IS NULL'
      let order_by = 'title'

      // wrap in a promise to await result
      const result = await new Promise((resolve,reject) => {

         this.#database.serialize(() => {
            
            sql = `SELECT COUNT(id) as count FROM collection_items WHERE ${status}`
            this.#database.get(sql, (error, rows) => {
               if(error) reject(error)
               if(rows) total_count = rows.count           
            })

            const fields = CollectionItem.#full_fields_list.map((field) => {
               return field.key
            })

            sql = `SELECT ${fields.toString()} 
                     FROM collection_items 
                     WHERE ${status}
                     ORDER BY ${order_by}
                     LIMIT ${this.#limit_read_all_records}`
            this.#database.all(sql, (error, rows) => {
               if(error) reject(error)
               if(rows) {
                  resolve(rows)
               }            
            })
         })
      }).catch((error) => this.set_last_error(error))

      const exportable_fields = CollectionItem.#full_fields_list.filter((field) => {
         if(field.export === true) return field
      })

      const fields = exportable_fields.map((field) => {
         return {
            key:field.key,
            test:field.test
         }
      })

      if(result) {
         let response_obj = {
            query:'read_all_collection_items',
            outcome:'success',
            count:total_count,
            collection_item_fields:fields,
            collection_items:result
         }
         return response_obj
      }
      else {
         let fail_response = {
            query:'read_all_collection_items',
            outcome:'fail',
            message:'There was an error attempting to read the records. [CollectionItem.read_all]  ' + this.#last_error.message
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
            `SELECT ${field_keys} FROM collection_items WHERE id = ${id}`,
            (error, rows) => {
               if(error) {
                  reject(error)
               }
               if(rows) {
                  resolve(rows) 
               }           
            }
         )
      }).catch((error) => this.set_last_error(error))

      const fields = CollectionItem.#full_fields_list.map((field) => {
         return {
            key:field.key,
            editable:field.editable,
            readonly:field.readonly,
            test:field.test,
            hidden:field.hidden ? field.hidden : null
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
   async create(collection_item,editable_only = true) {

      // min requirements
      if(collection_item.folder_path === undefined || collection_item.file_name === undefined) {
         return {
            query:'create_collection_item',
            outcome:'fail',
            message:`There was an error attempting to create the record. [CollectionItem.create]  
                  ${JSON.stringify(collection_item)} `
         }
      }

      // prevent duplicate
      // we use read() since we need to use field_filters
      // small additional cost (count) but low impact as volume imports are v. infrequent 
      let attempt_read_existing = await this.read({
            page:1,
            field_filters:[
               {field:'folder_path',value:collection_item.folder_path},
               {field:'file_name',value:collection_item.file_name}
            ]
      })

      // 'success' just means it worked, we still might not have a match
      if(attempt_read_existing.outcome === 'success') {

         // check for record
         if(attempt_read_existing.collection_items.length === 0) {

            let fields = CollectionItem.#full_fields_list

            // editable_only is from CollectionItemForm - 
            // we also permit inject from JSON files - in which case we retain all field_keys
            if(editable_only) {
               fields = fields.filter((field) => {
                  if(field.editable === true) return field
               })
               // we still require CrUd dates
               fields = [...fields,{key:'created_at'},{key:'updated_at'}]
            }

            const field_keys = fields.map((field) => field.key)

            // build '?' string=
            const inserts = field_keys.map((field) => {
               return '?'
            })

            // build values list - eg ["bar",2] - & add id at end
            const field_values = fields.map((field) => {
               return collection_item[field.key]
            })

            // Auto-gen candidate title from the file name if non-exists
            const title_pos = field_keys.findIndex((key) => key === 'title')
            if(field_values[title_pos] === undefined) {
               const file_name_pos = field_keys.findIndex((key) => key === 'file_name')
               let file_name = field_values[file_name_pos]
               if(file_name) {
                  field_values[title_pos] = title_from_file_name(file_name)
               }
            }

            // Populate file_type (if missing)
            const file_type_pos = field_keys.findIndex((key) => key === 'file_type')
            if(field_values[file_type_pos] === undefined) field_values[file_type_pos] = 'File'

            // Populate required dates if they are undefined
            let created_at = get_sqlready_datetime()
            const created_at_pos = field_keys.findIndex((key) => key === 'created_at')
            const updated_at_pos = field_keys.findIndex((key) => key === 'updated_at')
            if(field_values[created_at_pos] === undefined) field_values[created_at_pos] = created_at
            if(field_values[updated_at_pos] === undefined) field_values[updated_at_pos] = created_at

            const sql = `INSERT INTO collection_items(${field_keys.toString()}) 
                         VALUES(${inserts.toString()})`

            const result = await new Promise((resolve,reject) => {
               
               this.#database.serialize(() => {
                  this.#database.run(
                     sql,field_values, function(error) {
                        if(error) reject(error)
                        resolve(this.lastID)
                     }
                  )
               })
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
                  message:`There was an error attempting to create the record. [CollectionItem.create]  
                        ${JSON.stringify(collection_item)} ` + this.#last_error.message 
               }
               this.clear_last_error()
               return fail_response
            }
         }
         else {
            return {
               query:'create_collection_item',
               outcome:'fail',
               collection_item:{id:-1,...collection_item},  // -1 signifies although no errors, we didn't create since a record already existed
               message:`A record already exists for this file: ${collection_item.folder_path}\\${collection_item.file_name}`
            }
         }
      }
      else {
         return {
            query:'create_collection_item',
            outcome:'fail',
            message:'There was an error while checking for possible duplicates in CollectionItem.create'
         }
      }
   }


   //
   // Create a batch of records
   // For efficiency, we do not duplicate_check here, so clients are responsible for duplicate_checks
   // The focus of this function is to batch insert - say 100 records each insert (max permitted is 1000 values)  
   // syntax: INSERT INTO 'tablename' ('column1', 'column2') VALUES ('data1', 'data2'),('data1', 'data2'),('data1', 'data2');
   // currently, we don't use placeholders in sql statement - ok for this func - only internal clients
   // future: how to use placeholders for multiple VALUES LISTS in param to .run() below?
   //
   async create_batch(collection_items) {
      
      // fields list - excluding 'id' 
      let fields = CollectionItem.#full_fields_list.filter(field => field.key !== 'id')
      const field_keys = fields.map((field) => field.key)
      let values_lists = []

      for(const item of collection_items) {

         // exclude records w/ no file specified
         if(item.file_name ===  undefined || item.folder_path === undefined) {
            // future : review - do we want to notify user of nums. not added due to this check? (no file)
            // careful it doesn't trip up on files in the root_folder (eg folder_path = '')
            continue
         }

         let item_values = []

         for(const key of field_keys) {
            let value = item[key]

            switch(key) {
               case 'title':
                  // Auto-gen candidate title from the file name if non-exists
                  if(!item['title'] || item['title'] === '') {
                     item['file_name'] ? item_values.push(`"${title_from_file_name(item['file_name'])}"`) : item_values.push(`""`)
                  }
                  else {
                     item_values.push(`"${item['title']}"`)
                  }
                  break
               case 'file_type':
                  !item['file_type'] || item['file_type'] === ''  ? item_values.push('"FILE"') : item_values.push(`"${item[key]}"`)
                  break
               case 'created_at':
               case 'updated_at':
                  item_values.push(`"${get_sqlready_datetime()}"`)
                  break
               case 'deleted_at':
                  if(!value) 
                     item_values.push(`null`)
                  else 
                     value === 'null' ? item_values.push(`null`) : item_values.push(`"${item[key]}"`)
                     break
               default:
                  // empty str is fine for now since we don't have any INTEGER fields other than the excluded 'id'
                  item_values.push(item[key] ? `"${item[key]}"` : '""')
            }
         }         
         values_lists.push('(' + item_values.join(',') + ')')
      }
      const sql = `INSERT INTO collection_items(${field_keys.join(',')}) VALUES ${values_lists.join(',')}`
    
      const result = await new Promise((resolve,reject) => {         
         this.#database.serialize(async() => {
            this.#database.run(
               sql,[], function(error) {
                  if(error) reject(error)
                  resolve('success')
               }
            )
         })
      }).catch((error) => this.set_last_error(error))
   
      if(result) {
         return {
            query:'create_collection_item',
            outcome:'success'
         }
      }
      else {
         let fail_response = {
            query:'create_collection_item',
            outcome:'fail',
            message:`There was an error attempting to create the batch of records. [CollectionItem.create_batch]  
                  ` + this.#last_error.message 
         }
         this.clear_last_error()
         return fail_response
      }
   }


   //
   // Create From CSV
   // future : review - duplicate_check here doesn't appear to break import, so will 
   //         work with and test this until it proves otherwise. (cf json import needed separation)
   // cf create() - here, we always receive a raw csv line, which likely contains a prev. 'id' field
   // so we have to process and remove ourselves
   //
   async create_from_csv(csv) {

      // get 1-d arr of raw data for keys and values
      const field_keys = CollectionItem.#full_fields_list.map(field => field.key)
      const values = csv.split(',')
      
      // we use intermediate mapping in an assoc array to cleanly remove key-value pairs (eg 'id')
      const mapped_values = assoc_arr_obj(field_keys,values)

      // remove 'id'
      delete mapped_values['id']

      // prevent duplicate
      // we use read() since we need to use field_filters
      // small additional cost (count) but low impact as volume imports are v. infrequent 
      let attempt_read_existing = await this.read({
         page:1,
         field_filters:[
            {field:'folder_path',value:mapped_values['folder_path']},
            {field:'file_name',value:mapped_values['file_name']}
         ]
      })

      // 'success' just means it worked, we still might not have a match
      if(attempt_read_existing.outcome === 'success') {

         // check for record
         if(attempt_read_existing.collection_items.length === 0) {

            // get 1-d arr of keys
            const filtered_field_keys = Object.keys(mapped_values)

            // get 1-d arr of values (and translate any null fields rcvd as 'null')
            const filtered_values = Object.values(mapped_values).map(value => value === 'null' ? null : value)

            // create param placeholder str
            const param_placeholders = filtered_values.map(() => '?').toString()

            const sql = `INSERT INTO collection_items(${filtered_field_keys.toString()}) VALUES(${param_placeholders})`

            const result = await new Promise((resolve,reject) => {
               this.#database.run(
                  sql,filtered_values, function(error) {
                     if(error) reject(error)
                     resolve(this.lastID)
                  }
               )
            }).catch((error) => this.set_last_error(error))

            if(result) {
               return {
                  query:'create_collection_item_from_csv',
                  outcome:'success',
                  collection_item:{}
               }
            }
            else {
               let fail_response = {
                  query:'create_collection_item_from_csv',
                  outcome:'fail',
                  message:'There was an error attempting to create the record with title "' + mapped_values['title'] + '" - ' + this.#last_error.message
               }
               this.clear_last_error()
               return fail_response
            }
         }
         else {
            return {
               query:'create_collection_item_from_csv',
               outcome:'success',
               collection_item:{id:-1,...mapped_values},  // -1 signifies although no errors, we didn't create since a record already existed
               message:`A record already exists for this file [in create_from_csv]: ${mapped_values.folder_name}\\${mapped_values.file_name}`
            }
         }
      }
      else {
         return {
            query:'create_collection_item',
            outcome:'fail',
            message:'There was an error while checking for possible duplicates in CollectionItem.create_from_csv'
         }
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

      const field_keys = fields.map((field) => field.key)

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
   // parameter 'collection_item' is used to duplicate_check against 'folder_path\file_name'
   // 
   async restore(id,collection_item) {

      // check & notify if there is an existing record (created or imported after this record was deleted) 
      let attempt_read_existing = await this.read({
         page:1,
         field_filters:[
            {field:'folder_path',value:collection_item.folder_path},
            {field:'file_name',value:collection_item.file_name}
         ]
      })
      if(attempt_read_existing.outcome === 'success') {
         if(attempt_read_existing.collection_items.length > 0) {
            // duplicate - we notify and don't restore    
            return {
               outcome:'fail',
               message:`The attempt to restore this record failed 
                        as there is already an existing record for the specified file.
                        You may have created or imported a new record since deleting this one.
                        To restore this file, please delete the duplicate file first.`
            }
         }
      }

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
            query:'flush_deleted_collection_items',
            outcome:'success',
            message:'completed'
         }
      }
      else {
         let fail_response = {
            query:'flush_deleted_collection_items',
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
   async search(context) {

      // pagination
      let offset = (parseInt(context.page) - 1) * this.#items_per_page

      // execution time
      let execution_time = 0
      const start = Date.now()

      // filters
      let status = 'collection_items.deleted_at IS NULL'
      let order_by = 'title'
      if(context.filters) {
         status = get_status_condition_sql('collection_items',context.filters.record_status)
         order_by = get_order_by_condition_sql('collection_items',context.filters.order_by,context.filters.order_by_direction)
      }

      // process search_term
      if(!context.search_term) {
         return {
            query:'search_collection_items',
            outcome:'fail',
            message:'Please enter a valid search term.'
         }
      }
      let full_search_term = context.search_term.trim()
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
            if(row) {
               resolve(row.count)
            }
         })
      }).catch((error) => {
         this.set_last_error(error)
         return false
      })

      // execute the search
      let search_result = null
      
      // only retrieve records if they exist
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
                     ORDER BY
                        ${order_by}
                     LIMIT ${this.#items_per_page}
                     OFFSET ${offset}`

               this.#database.all(search_query,filtered_search_term_tokens, (error, rows) => {
                  if(error) {
                     this.set_last_error(error)
                     reject(error)
                  }
                  if(rows) resolve(rows)            
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
            context:context,
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
   // to vary search cols at user request - we can modify MATCH term to limit cols -
   //     eg   ci_fts MATCH 'title: eland';
   //          ci_fts MATCH '{title content_desc}:eland';
   //
   async search_fts(context) {

      // pagination
      let offset = (parseInt(context.page) - 1) * this.#items_per_page

      // execution time
      let execution_time = 0
      const start = Date.now()

      // filters
      // - we don't enable client-supplied 'order_by' since we order by rank (bm25)
      let status = 'collection_items.deleted_at IS NULL'
      if(context.filters) {
         status = get_status_condition_sql('collection_items',context.filters.record_status)
      }

      // process search_term
      if(!context.search_term) {
         return {
            query:'search_collection_items',
            outcome:'fail',
            message:'Please enter a valid search term.'
         }
      }

      // 
      // Receive user's input search term
      // We remove '-'s since they represent 'NOT' in fts and setting tokenizer on create 
      // table was giving unexpected results (as was attempting to enclose in double quotes).
      // This workaround is good enough in the vast majority of use-cases.
      //
      let rcvd_search_term = context.search_term.trim().replace('-',' ')
      if(rcvd_search_term.length < MIN_SEARCH_TERM_LEN) {  
         return {
            query:'search_collection_items',
            outcome:'fail',
            message:'The search term you entered has too few characters - please enter 3 or more characters.'
         }
      }

      // Package into Tokens for FTS
      // we package search_term into valid search token(s) string - eg 'gnu* OR eland*'
      let search_term_tokens = tokenize_search_term(rcvd_search_term)
      let tokenized_search_term = search_term_tokens.join('* OR ') + '*'

      // Get results count
      let total_count = await new Promise((resolve,reject) => {

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

         stmt.each(`${tokenized_search_term}`, (err, row) => {
            if(err) reject(err)
            stmt.finalize()
            if(row) {
               resolve(row.count)
            }
         })
      }).catch((error) => {
         this.set_last_error(error)
         return false
      })

      // Execute the search
      let search_result = null
         
      if(total_count) {
         search_result = await new Promise((resolve,reject) => {
            
            const fields = CollectionItem.#full_fields_list.map((field) => {
               return `collection_items.${field.key}`
            })

            const fts_ordered_weightings = CollectionItemFTS.get_ordered_weightings()

            // get results dataset (paginated by offset)
            // we order using bm25() rather than 'rank' col to permit weighting cols.
            const search_query = `
                  SELECT
                     ${fields.toString()},
                     bm25(collection_items_fts,${fts_ordered_weightings})
                  FROM collection_items
                     INNER JOIN collection_items_fts ci_fts
                     ON ci_fts.id = collection_items.id
                  WHERE 
                     collection_items_fts MATCH ?
                  AND 
                     ${status}
                  ORDER BY
                     bm25(collection_items_fts,${fts_ordered_weightings})
                  LIMIT ${this.#items_per_page}
                  OFFSET ${offset}`

            this.#database.all(search_query,`${tokenized_search_term}`, (error, rows) => {
               if(error) {
                  this.set_last_error(error)
                  reject(error)
               }
               if(rows) {
                  resolve(rows)   
               }         
            })
         }).catch((error) => {
            this.set_last_error(error)
            return false
         })
      }

      // Calc execution time
      const end = Date.now()
      execution_time = `${(end - start) / 1000} seconds`

      // Reduce fields to those required in CollectionItemCard (inc 'type' for displaying dates)
      const in_card_fields = this.get_in_card_fields(CollectionItem.#full_fields_list)

      // Respond      
      if(search_result || search_result === null) {
         return {
            query:'search_collection_items',
            outcome:'success',
            context:context,
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
   // Removes duplicates of existing records in a given array list of items
   // the unique key is 'folder_path\\file_name'
   // read() should only return a single record or none for each query
   //
   filter_out_duplicates = async(collection_items) => {

      const non_duplicate_items = []

      for(const item of collection_items) {
         let attempt_read_existing = await this.read({
            page:1,
            field_filters:[
               {field:'folder_path',value:item.folder_path},
               {field:'file_name',value:item.file_name}
            ]
         })

         if(attempt_read_existing.outcome === 'success') {
            if(attempt_read_existing.collection_items.length === 0) {
               // ok to proceed - we will create a record for this item
               non_duplicate_items.push(item)
            }
         }
      }
      return non_duplicate_items
   }


   //
   // filter to those fields required in CollectionItemCard display
   // and those fields passed to Record and Form
   //
   get_in_card_fields = (fields) => {
      const temp = fields.filter((field) => {
         if(field.in_card === true) return field
      })
      return temp.map((field) => {
         return {
            key:field.key,
            test:field.test,
            hidden:field.hidden
         }
      })
   }

   //
   // Dynamically build the INSTR sql constuct for our search tokens
   //
   build_instr_funcs_sql = (tokens) => {
      let sql = ''
      for(let i in tokens) {
         sql += ` INSTR( ${SEARCH_FIELDS} , ? ) +`     
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