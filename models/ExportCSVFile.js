const AppConfig = require('./AppConfig')
const CollectionItem = require('./CollectionItem')
const { get_sqlready_datetime } = require('../app/utilities/datetime')


// Create a csv file of the CollectionItem records dataset.


class ExportCSVFile {

   #database

   constructor(database) {
      this.#database = database
   }

   
   async create(file_name,file_path) {
      
      let collection_item = new CollectionItem(this.#database)

      // get all CollectionItem records and generate csv 
      const results = await collection_item.read_all()

      // Create an array of strings for each record
      let strings_arrays = []
      if(Array.isArray(results.collection_items)) {
         strings_arrays = results.collection_items.map((collection_item) => {
            let build_strings = []
            if(Array.isArray(results.collection_item_fields)) {
               results.collection_item_fields.forEach((field) => {
                  if(collection_item[field.key] === null) collection_item[field.key] = 'null'
                  build_strings.push(collection_item[field.key])
               })
            }
            return build_strings
         })
      }

      const fs = require('fs')
      
      try {
         let file = fs.createWriteStream(`${file_path}`)

         file.on('error', function(error) {
            return {
               outcome:'fail',
               message: 'Unable to create csv export file. ' + error.message
            }
         })
         strings_arrays.forEach(function(item) { 
            file.write(item + '\n') 
         })
         file.end()
         return {
            query:'export file',
            outcome:'success',
            file_name:file_name,
            file_path:file_path
         }
      }
      catch (error) {
         return {
            query:'export file',
            outcome:'fail',
            messge:error.message
         }
      }
   }
}


module.exports = ExportCSVFile