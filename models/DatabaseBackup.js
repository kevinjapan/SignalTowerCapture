const AppConfig = require('./AppConfig')
const { get_sqlready_datetime } = require('../app/utilities/datetime')


// Backup copies of the database file.
// The filename is retained and the file copied into a unique date-stamped parent folder.
// Thus restoring is simply copying/overwriting the current database file.


class DatabaseBackup {

   #database

   constructor(database) {
      this.#database = database
   }

   async create(file_name,file_path) {
      
      const fs = require('fs')
      const path = require('path')

      // to do : remove 
      // get backup_folder
      // const app_config = new AppConfig(this.#database)
      // const app_config_obj = await app_config.read_single()
      // const backup_folder = app_config_obj.app_config.backup_folder

      // make datestamped folder eg '2024-01-23'
      // const new_folder = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
      // const dir = `${backup_folder}${path.sep}${new_folder}`

      try {
         fs.copyFileSync(`.${path.sep}database${path.sep}signal-capture-database.sqlite`, `${file_path}`)
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