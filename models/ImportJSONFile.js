const AppConfig = require('./AppConfig')
const CollectionItem = require('./CollectionItem')
const { get_sqlready_datetime } = require('../app/utilities/datetime')


// Create a json file of the CollectionItem records dataset.



// to do : notify user while it is working - prevent other actions.

class ImportJSONFile {

   #database

   // sql - the maximum number of rows in one VALUES clause is 1000
   #batch_size = 100


   constructor(database) {
      this.#database = database
   }

   async import(file_path) {
      
      // to do : check - does file exist?        
      // if (!fs.existsSync(dir)){
      //    fs.mkdirSync(dir, { recursive: true })
      // }

      // to do : verify import_json_file is valid json or bail


      try {
         const collection_items = await this.get_json_file_contents(file_path)
         const total = collection_items.length
         for(let i = 0; i < total; i = i + this.#batch_size) {
            this.insert_batch(collection_items.slice(i,i + this.#batch_size))
         }
      }
      catch(error) {
         return {
            query:'import_json_file',
            outcome:'fail',
            message:'There was an error attempting to import the records. [ImportJSONFile.import]  ' + error
         }
      }
      return {
         query:'import_json_file',
         outcome:'success',
         message:'The records were successfully imported into the database.'
      }
   }

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

      
   
   insert_batch = async(items_batch) => {

      let collection_item = new CollectionItem(this.#database)

      items_batch.forEach(async(item) => {
         
         // 'id' is autoincrement, so we want the database to handle
         delete item['id']
      
         try {
            await collection_item.create(item)
         }
         catch(error) {
            throw 'Creating record failed in ImportJSONFile action.'
         }
      })
   }
}


module.exports = ImportJSONFile