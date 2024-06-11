const CollectionItem = require('./CollectionItem')
const { chunk_array } = require('../app/utilities/utilities')



// Import a JSON file of CollectionItem records.


class ImportJSONFile {

   #database

   #last_error

   // sql - the maximum number of rows in one VALUES clause is 1000
   #batch_size = 100


   constructor(database) {
      this.#database = database
   }

   async import(file_path) {
      
      const fs = require('fs')

      try {
         if(fs.existsSync(file_path)) {

            // get the import dataset
            const collection_items = await this.get_json_file_contents(file_path)
            const num_rcvd_items = collection_items.length

            // remove any duplicate records from import dataset
            const no_duplicate_collection_items = await this.remove_duplicate_records(collection_items)
            const num_non_duplicate_items = no_duplicate_collection_items.length            
            const duplicates_count = parseInt(num_rcvd_items - num_non_duplicate_items)

            if(num_non_duplicate_items < 1) {
               return {
                  query:'import_json_file',
                  outcome:'success',
                  message_arr:[
                     `${num_non_duplicate_items} record${num_non_duplicate_items !== 1 ?'s were' : ' was'} added from the ${num_rcvd_items} records read.`,
                     `${duplicates_count} record${duplicates_count !== 1 ? 's were' : ' was'} duplicate${duplicates_count !== 1 ? 's' : ''}.`
                  ]
               }
            }

            // process the new valid records
            const result = await this.process_records(no_duplicate_collection_items)


            if(result) {
               return {
                  query:'import_csv_file',
                  outcome:'success',
                  message_arr:[
                     `${num_non_duplicate_items} record${num_non_duplicate_items !== 1 ?'s were' : ' was'} added from the ${num_rcvd_items} records read.`,
                     `${duplicates_count} record${duplicates_count !== 1 ? 's were' : ' was'} duplicate${duplicates_count !== 1 ? 's' : ''}.`
                  ]
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
                     `${duplicates_count} record${duplicates_count !== 1 ? 's were' : ' was'} duplicate${duplicates_count !== 1 ? 's' : ''}.`
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
         // Errors caught: JSON,file not found
         return {
            query:'import_json_file',
            outcome:'fail',
            message_arr:['There was an error attempting to import the records. [ImportJSONFile.import]  ' + error]
         }
      }
   }

   //
   // Duplicate check
   //
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
            await collection_item.create_batch(chunk)
         }
         resolve({outcome:'success'})
      })

      return promise_result
   }


   //
   // retrieve the import file's JSON content
   // since we are calling JSON.parse, any errors in JSON will throw error 
   // which we will catch in import()
   //
   get_json_file_contents = async (filePath, encoding = 'utf8') => {
      const fs = require('fs')
      return new Promise((resolve, reject) => {
         fs.readFile(filePath, encoding, (err, contents) => {
            if(err) {
               return reject(err)
            }
            resolve(contents)
         })
      })
      .then(JSON.parse)
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


module.exports = ImportJSONFile