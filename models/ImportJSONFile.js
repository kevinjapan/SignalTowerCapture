const CollectionItem = require('./CollectionItem')
const { chunk_array } = require('../app/utilities/utilities')


// Import a JSON file of CollectionItem records.

class ImportJSONFile {

   #database

   #last_error

   // sql - the maximum number of rows in one VALUES clause is 1000
   #batch_size = 10 // to do : test w/ 100


   constructor(database) {
      this.#database = database
   }

   async import(file_path) {
      
      const fs = require('fs')

      try {
         if(fs.existsSync(file_path)) {
            const collection_items = await this.get_json_file_contents(file_path)
            const no_duplicate_collection_items = await this.remove_duplicates(collection_items)
            const result = await this.process_records(no_duplicate_collection_items)
            return {outcome:'success'} // to do : temp to verify UI front-end closes dlg
                                       //         we need actual response ('result' above) from main process
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

   // to do : we may have to manage json file sizes on export? - so export to batch files - not single monolithic file

   //
   // Duplicate check
   // Remove any items for which we already have a record
   // the unique key is 'folder_path\\file_name'
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