const sqlite3 = require('sqlite3').verbose()
const { 
   get_full_fields,
   get_table_create_fields,
   get_table_insert_fields 
} = require('../utilities/database_utilities')


//
// Database
// wrapper class for sqlite3 object
//


class Database {

   // the sqlite database
   #db

   #database_path = './database/signal-tower-capture-db.sqlite'

   #last_error


   //
   // Open database file if exists or create, while notify errors to client if any arise
   //
   open_safely = async () => {

      // check folder exists
      const fs = require('fs')
      try {
         if (!fs.existsSync('database')){
            fs.mkdirSync('database', { recursive: true })
         }
      }
      catch(error) {
         let response_obj = {
            outcome:'fail',
            message: 'There was an error making the database folder', error
         }
         return response_obj
      }

      // open database - creates a database file if doesn't already exist
      let result = await new Promise(async (resolve,reject) => {
         this.#db = new sqlite3.Database(this.#database_path,async(error) => {
            if(error) {
               reject(`There was an error attempting to open the database.\nPlease check that the database file and it's parent folder exist.\n\nYou could try starting the application again.\nIf the problem persists, it may be recoverable by restoring the database file.\n\n${this.#database_path}`,error.message)
            }
            else {
               await this.create_tables()
               resolve('Database was successfully opened')
            }
         })
      }).catch((error) => this.set_last_error(error))
      

      // this class is just a wrapper for encapsulted sqlite3 database obj
      if(result) {
         let response_obj = {
            outcome:'success',
            database:this.#db
         }
         return response_obj
      }
      else {
         let response_obj = {
            outcome:'fail',
            message: this.#last_error
         }
         return response_obj
      }
   }


   //
   // create the database tables
   // sqlite PRIMARY KEY auto-increments by default (we do not explicitly use AUTOINCREMENT)
   //
   create_tables = async() => {

      this.#db.serialize(async() => {

         // CollectionItems table
         //
         let ci_create_cols_csv = get_table_create_fields('collection_items')
         this.#db.run(`CREATE TABLE IF NOT EXISTS collection_items (${ci_create_cols_csv})`, function (error) {
               if(error) console.log('There was an error initializing the database. ',error.message)
            }
         )

         this.add_new_collection_item_columns()

         // CollectionItems_fts table
         // we don't include 'data_type' for full text search virtual table
         //
         let collection_items_fts_fields = get_table_insert_fields('collection_items_fts')
         this.#db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS 
                        collection_items_fts USING fts5 (${collection_items_fts_fields})`, function (error) {
               if(error) console.log('There was an error initializing the database. ',error.message)
            }
         )

         // Tags table
         //
         let tags_fields = get_table_create_fields('tags')
         this.#db.run(`CREATE TABLE IF NOT EXISTS tags (${tags_fields})`,function (error) {
               if(error) console.log('There was an error initializing the database. ',error.message)
            }
         )
  
         // AppConfig table
         //
         let app_config_fields = get_table_create_fields('app_config')
         this.#db.run(`CREATE TABLE IF NOT EXISTS app_config (${app_config_fields})`, function (error) { 
               if(error) console.log('There was an error initializing the database. ',error.message)
            }
         )

         this.create_fts_triggers()
      })
   }


   //
   // exectute Add Column for any new CollectionItem fields currently not in the 'collection_items' database table
   // future : expand this to add cols to any of the tables
   //
   add_new_collection_item_columns = async() => {

      const collection_items_full_fields = get_full_fields('collection_items')

      // add any columns added to CollectionItem since current database initialization
      // permits additions to integrate w/ existing records
      // to do : ensure we only run if table was *not* created this time.

      // get current cols in database.'collection_items'
      const result = await new Promise((resolve,reject) => {
         this.#db.all(`SELECT GROUP_CONCAT(NAME,',') as cols FROM PRAGMA_TABLE_INFO('collection_items')`, function (error,rows) {
               if(error) console.log('There was an error reading table info from the database. ',error.message)
               resolve(rows[0])
            }
         )
      }).catch((error) => {
         this.set_last_error(error)
      })

      // find any differences w/ CollectionItem fields list
      let cols_not_in_database = []
      const current_fields = result.cols.split(',') 
      const collection_items_insert_fields = get_table_insert_fields('collection_items')
      cols_not_in_database = collection_items_insert_fields.filter(field => 
         !current_fields.includes(field)
      )

      //sqlite has no IF NOT EXISTS for ADD COLUMN - so we handle exception if cols already exists
      cols_not_in_database.forEach(col => {
         try {
            const data_type = collection_items_full_fields.filter(field => field.key === col)[0].data_type
            this.#db.run(`ALTER TABLE collection_items ADD COLUMN ${col} ${data_type}`)
         } 
         catch (error) {
            console.log(`Failed to ADD COLUMN ${col} ${data_type} to collection_items table`,error)
         }
      })
   }


   //
   // Triggers for FTS
   // synch 'collection_items_fts' w/ 'collection_items'
   //
   create_fts_triggers() {

         let fts_insert_fields = get_table_insert_fields('collection_items_fts')
         let fts_insert_fields_values = fts_insert_fields.map(field => `NEW.${field}`)

         // create record trigger
         this.#db.run(`CREATE TRIGGER IF NOT EXISTS insert_collection_items_fts 
                        after INSERT on collection_items
                        begin
                           INSERT INTO collection_items_fts (${fts_insert_fields})
                           VALUES(${fts_insert_fields_values});
                        end;`,function (error) {
               if(error) console.log('There was an error initializing the database. ',error.message)
            }
         )

         // update record trigger
         let update_fields = fts_insert_fields.filter(field => {
            return field !== 'id'
         })
         let new_update_fields = update_fields.map(field => {
            return `${field} = NEW.${field}`
         })
         this.#db.run(`CREATE TRIGGER IF NOT EXISTS update_collection_items_fts 
                        after UPDATE on collection_items
                        begin
                           UPDATE collection_items_fts
                           SET ${new_update_fields}
                           WHERE id = NEW.id;
                        end;`, function (error) {
               if(error) console.log('There was an error initializing the database. ',error.message)
            }
         )

         // delete record trigger
         this.#db.run(`CREATE TRIGGER IF NOT EXISTS delete_collection_items_fts 
                        after DELETE on collection_items
                        begin
                           DELETE FROM collection_items_fts
                           WHERE id = OLD.id;
                        end;`, function (error) {
               if(error) console.log('There was an error initializing the database. ',error.message)
            }
         )
   }



   close() {
      this.#db.close()
   }

   run(sql,param) {
      this.#db.run(sql,param)
      return this
   }

   //
   // error handlers for our promise wrappers around database calls
   // any client method calling set_last_error should clear after use to prevent leaking 
   //
   set_last_error = (error) => {
      this.#last_error = error
   }
}


module.exports = Database