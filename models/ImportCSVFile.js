const CollectionItem = require('./CollectionItem')
const { is_valid_collection_item_csv } = require('../app/utilities/validation')


// Import a CSV file of CollectionItem records.
// We insert single CollectionItem records at a time to allow preventing duplicates


class ImportCSVFile {

   #database

   #last_error

   // sqlite - the maximum number of rows in one VALUES clause is 1000
   #batch_size = 100

   constructor(database) {
      this.#database = database
   }


   async import(file_path) {
      
      const fs = require('fs')
      const readline = require('node:readline')

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

         for await (const line of rl) {

            // we test first line for correct no. fields and that fields are valid (assuming all lines same format!)
            if(first_line) {
               
               const valid_first_line = is_valid_collection_item_csv(CollectionItem.get_full_fields_list(),line)

               // bail and notify if import file does not match expected fields
               if(valid_first_line.outcome === 'fail') {

                  const error_strs = valid_first_line.errors.map(error => {
                     return `${error.name ? error.name + ':' : ''} ${error.message} ${error.value ? error.value + ':' : ''}`
                  })
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

            // prevent further line/record validation (we assume format followed throughout file)
            first_line = false

            let promise_result = await new Promise(async(resolve,reject) => {
   
               let result = await collection_item.create_from_csv(line)
               if(result.outcome === 'success') {   
                  count++           
                  resolve(result)
               }
               else {
                  reject(result.message)
               }
            }).catch((error) => {
               this.set_last_error(error)
            })

            if(promise_result) {
               // do nothing
            }
            else {
               let fail_response = {
                  query:'import_csv_file',
                  outcome:'fail',
                  message_arr:[
                     count + ' records were created. ' ,
                     this.#last_error ,
                     'No more records were processed after line ' + count + '.'
                  ]
               }
               this.clear_last_error()
               return fail_response
            }
         }
      }
      else {
         return  {
            query:'import_csv_file',
            outcome:'fail',
            message:'The file was not found.' + file_path
         }
      }
      return {
         query:'import_csv_file',
         outcome:'success'
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