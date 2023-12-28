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

            console.log('opening file')
            const collection_items = await this.get_json_file_contents(file_path)

            await this.process_records(collection_items)

            return {
               query:'import_json_file',
               outcome:'success',
               message:'The records were successfully imported into the database.'
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
            message:'There was an error attempting to import the records. [ImportJSONFile.import]  ' + error
         }
      }
   }


   process_records = async(collection_items) => {

      const collection_item = new CollectionItem(this.#database)
      const total = collection_items.length
      let result = null

      // using for(..of..) instead of forEach() allows us to await successfully
      for(const item of collection_items) {

         delete item.id

         result = await new Promise(async(resolve,reject) => {
            let result = await collection_item.create(item,false)
            if(result.outcome !== 'success') {
               reject(result.message)
            }
            else {
               resolve(result.collection_item.id)
            }
         }).catch((error) => this.set_last_error(error))
         
         // successful result will contain id of newly created record
         console.log(result)
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