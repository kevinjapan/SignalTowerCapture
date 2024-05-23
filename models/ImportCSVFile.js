const CollectionItem = require('./CollectionItem')
const { is_valid_collection_item_csv } = require('../app/utilities/validation')
const { assoc_arr_obj,chunk_array } = require('../app/utilities/utilities')




// Import a CSV file of CollectionItem records


class ImportCSVFile {

   #database

   #last_error

   // sql - the maximum number of rows in one VALUES clause is 1000
   #batch_size = 10 // to do : test w/ 100 - rollout to ImportJSONFile

   constructor(database) {
      this.#database = database
   }


   // to do : - bug - import signal-tower-capture-export-2024-05-21.txt			to do 
   //      currently saves all 500 non-duplicates to 'Deleted Records'


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
  
            // we check first line and only proceed if it matches expected fields and data validation
            let first_line = true
            let count = 1
            let failed_lines = []

            // we will build arr of collection_items from lines
            let collection_items = []
            const field_keys = CollectionItem.get_full_fields_list().map(field => field.key)
            let values         
            for await (const line of rl) {

               // Validate file format from first line (if auto-generated CSV file, we assume consistent throughout - bar errors in values)
               if(first_line) {
                  const valid_first_line = is_valid_collection_item_csv(CollectionItem.get_full_fields_list(),line)

                  // bail and notify if import file does not match expected fields
                  if(valid_first_line.outcome === 'fail') {
                     let error_strs = ''
                     if(Array.isArray(valid_first_line.errors)) {
                        error_strs = valid_first_line.errors.map(error => {
                           return `${error.message}`
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
                  first_line = false  // prevent further line/record validation (we assume format followed throughout file)
                  count++
               }
               // Validate subsequent lines - we only show first 10 failing lines (avoid proliferation on UI)
               // user can view subsequent by fixing current displayed issues if required.
               // This does nearly double time taken but we have already cut time significantly, 
               // and the payoff of getting info. back on errors in the CSV file is worth it.
               // to do : test we cap off failed_lines cleanly..
               else if(failed_lines.length < 11) {
                  const valid_item_obj = is_valid_collection_item_csv(CollectionItem.get_full_fields_list(),line)
                  if(valid_item_obj) {
                     if(valid_item_obj.outcome === 'fail') {
                        valid_item_obj.line = count
                        failed_lines.push(valid_item_obj)
                     }
                  }
                  count++
               }

               values = line.split(',')
               collection_items.push(assoc_arr_obj(field_keys,values))
            }

            const num_rcvd_items = collection_items.length
            const no_duplicate_collection_items = await this.remove_duplicate_records(collection_items)
            const num_non_duplicate_items = no_duplicate_collection_items.length

            if(num_non_duplicate_items < 1) {
               return {
                  query:'import_csv_file',
                  outcome:'success',
                  message_arr:[
                     `${num_non_duplicate_items} records were added from the ${num_rcvd_items} lines read.`,
                     `${num_rcvd_items - num_non_duplicate_items} records were duplicates.`
                  ],
                  failed_lines:failed_lines
               }
            }
               
            const result = await this.process_records(no_duplicate_collection_items)
         
            if(result) {
               return {
                  query:'import_csv_file',
                  outcome:'success',
                  message_arr:[
                     `${num_non_duplicate_items} records were added from the ${num_rcvd_items} lines read.`,
                     `${num_rcvd_items - num_non_duplicate_items} records were duplicates.`
                  ],
                  failed_lines:failed_lines
               }
            }
            else {
               let fail_response = {
                  query:'import_csv_file',
                  outcome:'fail',
                  message_arr:[
                     `There was an error attempting to import the CSV file. [ImportCSVFile.import]`,
                     // this.#last_error.message,
                     `${num_non_duplicate_items} records were added from the ${num_rcvd_items} lines read.`,
                     `${num_rcvd_items - num_non_duplicate_items} records were duplicates.`
                  ]
               }
               this.clear_last_error()
               return fail_response
            }
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
            message_arr:['There was an error attempting to import the records. [ImportCSVFile.import]  ' + error]
         }
      }
   }

   //
   // Duplicate check
   // to do : we prob don't want to also check for duplicates in Deleted Records -
   //         but consider - what if a duplicate record is 'restored'? (rollout ImportJSONFile)
   remove_duplicate_records = async(collection_items) => {      
      const collection_item_obj = new CollectionItem(this.#database)
      return await collection_item_obj.filter_out_duplicates(collection_items)
   }


   //
   // Batch insert records (max permitted is 1000 values)
   // We assume all are duplicate_checked prior to submission here
   // CollectionItem.create_batch will exclude 'id'
   //
   process_records = async(collection_items) => {

      if(!Array.isArray(collection_items) || collection_items.length < 1) return false

      const collection_item = new CollectionItem(this.#database)      
      let promise_result = null
      const arr_of_chunks = chunk_array(collection_items,this.#batch_size)
 
      promise_result = await new Promise(async(resolve,reject) => {
         // submit each 'chunk' of items for batch INSERT
         for(const chunk of arr_of_chunks) {
            console.log('CHUNK',chunk)
            await collection_item.create_batch(chunk)
         }
         resolve({outcome:'success'})
      })

      return promise_result
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