const CollectionItem = require('./CollectionItem')


// Import a JSON file of CollectionItem records.
// Currently we insert single CollectionItem records at a time,
// inefficient but sufficient for current use-cases (primarily dev)

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
            const collection_items = await this.get_json_file_contents(file_path)
            return await this.process_records(collection_items)
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
            message:'There was an error attempting to import the records. [ImportJSONFile.import]  ' + error
         }
      }
   }


   process_records = async(collection_items) => {

      const collection_item = new CollectionItem(this.#database)
      let promise_result = null

      // using for(..of..) instead of forEach() allows us to await successfully
      for(const item of collection_items) {

         // new item, we remove id
         delete item.id  // to do : cf w/ ImportCSVFile - delete id is in CollectionItem ?

         promise_result = await new Promise(async(resolve,reject) => {

            let result = await collection_item.create(item,false)            
            if(result.outcome === 'success') {  
               console.log('trying',result)            
               resolve(result.collection_item.id)
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
               query:'import_json_file',
               outcome:'fail',
               message:'There was an error attempting to create the record. [ImportJSONFile.process_records]  ' + this.#last_error
            }
            this.clear_last_error()
            return fail_response
         }
      }
      
      return {
         query:'import_json_file',
         outcome:'success'
      }
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