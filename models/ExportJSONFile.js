const AppConfig = require('./AppConfig')
const CollectionItem = require('./CollectionItem')
const { get_sqlready_datetime } = require('../app/utilities/datetime')


// Create a json file of the CollectionItem records dataset.

// to do : currently doesn't export 'soft deleted' records - review

class ExportJSONFile {

   #database

   constructor(database) {
      this.#database = database
   }

   async create() {
      
      let collection_item = new CollectionItem(this.#database)

      // get all CollectionItem records and generate json 
      const results = await collection_item.read_all()

      if(results) {

         const json_output = JSON.stringify(results.collection_items,null,4)

         const fs = require('fs')
         const path = require('node:path')
         
         // get export_folder
         const app_config = new AppConfig(this.#database)
         const app_config_obj = await app_config.read_single()
         const export_folder = app_config_obj.app_config.export_folder
         
         // make datestamped folder eg '2024-01-23'
         const new_folder = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
         const dir = `${export_folder}${path.sep}${new_folder}`

         try {

            if (!fs.existsSync(dir)){
               fs.mkdirSync(dir, { recursive: true })
            }

            var file = fs.createWriteStream(`${export_folder}${path.sep}${new_folder}${path.sep}signal-capture-export.json`)

            file.on('error', function(error) {
               return {
                  outcome:'fail',
                  message: 'Unable to create csv export file. ' + error.message
               }
            })
               
            // we are writing all records as a single json string
            // should be ok given expected small dataset sizes.
            file.write(json_output) 
            
            file.end()
            return {
               query:'export file',
               outcome:'success',
               file_name:'export.txt',
               file_path:export_folder
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
}


module.exports = ExportJSONFile