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
      let strings_arrays = results.collection_items.map((collection_item) => {
         let build_strings = []
         results.collection_item_fields.forEach((field) => {
            if(collection_item[field.key] === null) collection_item[field.key] = 'null'
            build_strings.push(collection_item[field.key])
         })
         return build_strings
      })

      const fs = require('fs')
      
      // to do : remove 
      // get export_folder
      // const app_config = new AppConfig(this.#database)
      // const app_config_obj = await app_config.read_single()
      // const export_folder = app_config_obj.app_config.export_folder
      
      // make datestamped folder eg '2024-01-23'
      // const new_folder = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
      // const dir = `${export_folder}${path.sep}${new_folder}`

      try {

         // if (!fs.existsSync(dir)){
         //    fs.mkdirSync(dir, { recursive: true })
         // }

         var file = fs.createWriteStream(`${file_path}`)

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