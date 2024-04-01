const CollectionItem = require('./CollectionItem')


// Import a CSV file of CollectionItem records.
// Currently we insert single CollectionItem records at a time,
// to do : batch insert?

// risks
// - large import files (>300 records) will noticeably lock the app
//
// mitigations
// - batch inserts (see below)
// - limit size of export files we create (say 500 records) but create multiples if required.
//
// future:
// - build batch insert statements - say 100 records each insert (max permitted is 1000 values)
//



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

            for await (const line of rl) {

               // to do : first - we'll just save one at a time - get that working, and time cf w/ import json 
               //         then we'll try sql batches.
               // - get working and test w/ broken csv first w/ one create at a time and then check performance
               //   how do we handle if breaks on one record (one line) - prob ok to bail - likely all broken?
               //   difficult to report errors if we are handling batches? relevant? just fail whole file?

               // to do : fails if tags is populate w/ it's own csv..   can't simply quote.  - re-do tags w/ their own separator

               let promise_result = await new Promise(async(resolve,reject) => {
      
                  let result = await collection_item.create_from_csv(line,false)

                  // to do : test w/ deliberately missing or misplace fields - eg null for dates etc (NOT NULL columns)
                  //          currently doesn't handle this well - notify and non-breaking required
  
                  if(result.outcome === 'success') {              
                     resolve(result)
                  }
                  else {
                     reject(result.message)
                  }
               }).catch((error) => {
                  this.set_last_error(error)
               })


               if(promise_result) {
                  // nothing
               }
               else {
                  let fail_response = {
                     query:'create_collection_item',  // to do : update adaption from ImportJSONFile
                     outcome:'fail',
                     message:'35 There was an error attempting to create the record. [ImportJSONFile.process_records]  ' + this.#last_error
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