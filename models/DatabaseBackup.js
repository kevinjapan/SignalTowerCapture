const AppConfig = require('./AppConfig')
const { get_sqlready_datetime } = require('../app/utilities/datetime')


// Backup of the database file.



class DatabaseBackup {

   async create(file_name,file_path) {
      
      const fs = require('fs')
      const path = require('path')

      try {
         fs.copyFileSync(`.${path.sep}database${path.sep}stc-db.sqlite`, `${file_path}`)
         return {
            query:'create_backup',
            outcome:'success',
            file_name:file_name,
            file_path:file_path
         }
      }
      catch(error) {
         return {
            query:'create_backup',
            outcome:'fail',
            message:error.message
         }
      }
   }
}


module.exports = DatabaseBackup