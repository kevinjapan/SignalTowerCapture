const AppConfig = require('./AppConfig')
const CollectionItem = require('./CollectionItem')
const { get_sqlready_datetime } = require('../app/utilities/datetime')



// Create a JSON file of the CollectionItem records dataset.


class ExportJSONFile {

   #database

   constructor(database) {
      this.#database = database
   }

   async create(file_name,file_path) {

      console.log('create',file_name,file_path)
      
      let collection_item = new CollectionItem(this.#database)

      // get all CollectionItem records and generate json 
      const results = await collection_item.read_all()

      if(results) {

         const json_output = JSON.stringify(results.collection_items,null,4)

         const fs = require('fs')
         
         // get export_folder
         // const app_config = new AppConfig(this.#database)
         // const app_config_obj = await app_config.read_single()
         // const export_folder = app_config_obj.app_config.export_folder
         
         // make datestamped folder eg '2024-01-23'
         // const new_folder = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
         // const dir = `${export_folder}${path.sep}${new_folder}`

         try {

            // to do : tidy all export/backup models files
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
               
            // we are writing all records as a single json string
            // should be ok given expected small dataset sizes.
            file.write(json_output) 
            
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
}


module.exports = ExportJSONFile