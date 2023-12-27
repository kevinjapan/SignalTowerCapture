const sqlite3 = require('sqlite3').verbose()
const AppConfig = require('../../models/AppConfig')
const CollectionItem = require('../../models/CollectionItem')


//
// Database
// wrapper class for sqlite3 object
//


class Database {

   // the sqlite database
   #db

   #database_path = './database/signal-capture-database.sqlite'

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
         console.log('error making database folder',error)
      }

      // open database - creates a database file if doesn't already exist
      let result = await new Promise(async (resolve,reject) => {
         this.#db = new sqlite3.Database(this.#database_path,async(error) => {
            if(error) {
               reject(`There was an error attempting to open the database.\nPlease check that the database file and it's parent folder exist.\n\nYou could try starting the application again.\nIf the problem persists, it may be recoverable by restoring the database file.\n\n${this.#database_path}`,error.message)
            }
            else {
               this.create_tables()
               resolve('Database was successfully opened')
            }
         })
      }).catch((error) => this.set_last_error(error))

      // this class is just a wrapper - we essentially return the encapsulted sqlite3 database obj
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
   create_tables = () => {


      this.#db.serialize(() => {

         // CollectionItems table

         let collection_items_fields = CollectionItem.get_full_fields_list()
         let sql = ''
         if(Array.isArray(collection_items_fields)) {
            collection_items_fields.forEach((field) => {
               sql += field.key + ' ' + field.sql + ','
            })
         }
         sql = sql.slice(0,-1)

         this.#db.run(`CREATE TABLE IF NOT EXISTS collection_items (${sql})`,
            function (error) {
               if(error) {
                  console.log('There was an error initializing the database. ',error.message)
               }
            }
         )


         // CollectionItems FTS virtual table
         // support FTS5 full text search extension
         // to do : create cols dynamically 'title,content_desc' - these two only sufficient?
         // to do : verify 'id' is ok - eg on create new it will be assigned first..
         this.#db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS 
                        collection_items_fts USING fts5 (id,title,content_desc)`,
            function (error) {
               if(error) {
                  console.log('There was an error initializing the database. ',error.message)
               }
            }
         )


         // Triggers for collection_items_fts
         // synch collection_items_fts w/ collection_items
         // to do : verfiy .run() is correct method for creating TRIGGERs
         this.#db.run(`CREATE TRIGGER IF NOT EXISTS insert_collection_items_fts 
                        after INSERT on collection_items
                        begin
                           INSERT INTO collection_items_fts (id,title,content_desc)
                           VALUES(NEW.id,NEW.title,NEW.content_desc);
                        end;`,
            function (error) {
               if(error) {
                  console.log('There was an error initializing the database. ',error.message)
               }
            }
         )
         this.#db.run(`CREATE TRIGGER IF NOT EXISTS update_collection_items_fts 
                        after UPDATE on collection_items
                        begin
                           UPDATE collection_items_fts
                           SET
                              title = NEW.title,
                              content_desc = NEW.content_desc
                           WHERE id = NEW.id;
                        end;`,
            function (error) {
               if(error) {
                  console.log('There was an error initializing the database. ',error.message)
               }
            }
         )
         // to do : this relies on titles being unique - rollout to front-end 'add item'
         this.#db.run(`CREATE TRIGGER IF NOT EXISTS delete_collection_items_fts 
                        after DELETE on collection_items
                        begin
                           DELETE FROM collection_items_fts
                           WHERE id = OLD.id;
                        end;`,
            function (error) {
               if(error) {
                  console.log('There was an error initializing the database. ',error.message)
               }
            }
         )

         
         // AppConfig table
        
         let app_config_fields = AppConfig.get_full_fields_list()
         sql = ''
         if(Array.isArray(app_config_fields)) {
            app_config_fields.forEach((field) => {
               sql += field.key + ' ' + field.sql + ','
            })
         }
         sql = sql.slice(0,-1)
         this.#db.run(`CREATE TABLE IF NOT EXISTS app_config (${sql})`,
            function (error) { 
               if(error) {
                  console.log('There was an error initializing the database. ',error.message)
               }
            }
         )
      })
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