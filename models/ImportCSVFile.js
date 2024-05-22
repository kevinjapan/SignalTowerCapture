const CollectionItem = require('./CollectionItem')
const { is_valid_collection_item_csv } = require('../app/utilities/validation')
const { assoc_arr_obj } = require('../app/utilities/utilities')
const { chunk_array } = require('../app/utilities/utilities')
const { read } = require('fs')



// Import a CSV file of CollectionItem records


class ImportCSVFile {

   #database

   #last_error

   // sql - the maximum number of rows in one VALUES clause is 1000
   #batch_size = 10 // to do : test w/ 100

   constructor(database) {
      this.#database = database
   }


   async import(file_path) {
      
      const fs = require('fs')
      const readline = require('node:readline')

      try {
         if(fs.existsSync(file_path)) {

            const read_stream = fs.createReadStream(file_path)
            const rl = readline.createInterface({
               input:read_stream,
               crlfDelay:Infinity,
            })
            
            const collection_item = new CollectionItem(this.#database)

            let count = 0

            // we check first line and only proceed if it matches expected fields and data validation
            let first_line = true

            //
            // to do : we have to refactor as we did w/ ImportJSONFile
            //

            // we will build arr of collection_items from lines
            let collection_items = []
            const field_keys = CollectionItem.get_full_fields_list().map(field => field.key)
            let values         
            for await (const line of rl) {

               // to do : package/farm this & re-use in ImportJSONFile?
               // we test first line for correct no. fields and that fields are valid (assuming all lines same format!)
               if(first_line) {                  
                  const valid_first_line = is_valid_collection_item_csv(CollectionItem.get_full_fields_list(),line)

                  // bail and notify if import file does not match expected fields
                  if(valid_first_line.outcome === 'fail') {
                     let error_strs = ''
                     if(Array.isArray(valid_first_line.errors)) {
                        error_strs = valid_first_line.errors.map(error => {
                           return `${error.name ? error.name + ':' : ''} ${error.message} ${error.value ? error.value + ':' : ''}`
                        })
                     }
                     return  {
                        query:'import_csv_file',
                        outcome:'fail',
                        message_arr:[
                           'The file does not contain valid records.',
                           '0 records were created.',
                           ...error_strs
                        ]
                     }
                  }
               }
               first_line = false  // prevent further line/record validation (we assume format followed throughout file)

               values = line.split(',')
               collection_items.push(assoc_arr_obj(field_keys,values))
            }
            const num_rcvd_items = collection_items.length

            const no_duplicate_collection_items = await this.remove_duplicates(collection_items)
            const num_non_duplicate_items = no_duplicate_collection_items.length

            // log action (to do : log where?)
            console.log(num_non_duplicate_items,'records were added from the',num_rcvd_items,'read.',num_rcvd_items - num_non_duplicate_items,'records were duplicates.')

            const result = await this.process_records(no_duplicate_collection_items)

            // ----------------------------------------------------------------------
            // to do : enable wait dlg as w/ ImportJSONFile
            // ----------------------------------------------------------------------

            return {outcome:'success'} // to do : temp to verify UI front-end closes dlg
            //         we need actual response ('result' above) from main process
         }
         else {
            throw 'The import file was not found.'
         }
      }
      catch(error) {
         // Errors caught: CSV,file not found
         return {
            query:'import_csv_file',
            outcome:'fail',
            message:'There was an error attempting to import the records. [ImportCSVFile.import]  ' + error
         }
      }
      // }
      // else {
      //    return  {
      //       query:'import_csv_file',
      //       outcome:'fail',
      //       message:'The file was not found.' + file_path
      //    }
      // }
      // return {
      //    query:'import_csv_file',
      //    outcome:'success'
      // }
   }

   //
   // Duplicate check
   // Remove any items for which we already have a record
   // the unique key is 'folder_path\\file_name'
   //
   // to do : duplicates code in ImportJSONFile.js - farm out?
   //
   remove_duplicates = async(collection_items) => {

      const filtered_items = []

      for(const item of collection_items) {         
         const collection_item_obj = new CollectionItem(this.#database)
         let attempt_read_existing = await collection_item_obj.read({
            page:1,
            field_filters:[
               {field:'folder_path',value:item.folder_path},
               {field:'file_name',value:item.file_name}
            ]
         })
         if(attempt_read_existing.outcome === 'success') {
            if(attempt_read_existing.collection_items.length === 0) {
               // ok to proceed - we will create a record for this item
               filtered_items.push(item)
            }
         }
      }
      return filtered_items
   }

     //
   // Batch insert records (max permitted is 1000 values)
   // We assume all are duplicate_checked prior to submission here
   //
   process_records = async(collection_items) => {

      // to do : remove 'id' ?


      if(!Array.isArray(collection_items) || collection_items.length < 1) return false

      const collection_item = new CollectionItem(this.#database)
      
      let promise_result = null
      const arr_of_chunks = chunk_array(collection_items,this.#batch_size)
 
      promise_result = await new Promise(async(resolve,reject) => {

         // submit each 'chunk' of items for batch INSERT
         for(const chunk of arr_of_chunks) {
            let result = await collection_item.create_batch(chunk)    
            if(result.outcome === 'success') {
               resolve({outcome:'success'})
            }
            else {
               reject({outcome:'fail'})
            }
         }
         resolve({outcome:'success'})
      })

      console.log('RESULT',result)
     
      // to do : adapt this handling block
      if(promise_result) {
         // nothing
      }
      else {
         let fail_response = {
            query:'import_json_file',
            outcome:'fail',
            message:'There was an error attempting to create the record. [ImportJSONFile.process_records]  ' + this.#last_error
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


module.exports = ImportCSVFile