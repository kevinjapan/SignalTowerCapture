const CollectionItem = require('./CollectionItem')
const { get_sqlready_datetime } = require('../app/utilities/datetime')
const { get_random_string } = require('../app/utilities/strings')
const { get_random_int } = require('../app/utilities/utilities')


// Populate CollectionItem record dataset with test data.
// Enabled in dev mode only.


class TestRecord {

   #database

   #max_records_permitted = 100    // there were issues attempting more than 100 (good enough)

   constructor(database) {
      this.#database = database
   }

   async create(num_records = 20) {

      if(num_records > this.#max_records_permitted) {
         num_records = this.#max_records_permitted
      }
      
      // remove 'id' ('autoincrement' primary key)
      const no_id_list = CollectionItem.get_full_fields_list().filter((field) => {
         return field.key !== 'id'
      })
      const ci_full_fields_list = no_id_list.map((field) => {
         return field.key
      })

      const ci_inserts = ci_full_fields_list.map(() => {
         return '?'
      })


      let field_values

      this.#database.serialize(() => {

         // insert into CollectionItems table

         let stmt = this.#database.prepare(`INSERT INTO collection_items (${ci_full_fields_list}) VALUES (${ci_inserts.toString()})`)
         for (let i = 0; i < num_records; i++) {
            
            // build values list - eg ["bar",2,"maryland ohio"]
            field_values = no_id_list.map((field) => {
               switch(field.test.type) {
                  case 'date':
                     return get_sqlready_datetime(Date())
                  case 'string':
                     return get_random_string()
                  case 'int':
                     return get_random_int()        
               }
            })

            stmt.run([...field_values],
               function (error) { 
                  if(error) {
                     console.log(error.message)
                  }
               })
         }
         stmt.finalize()
      })
      return 'completed TestRecord.create'
   }

}


module.exports = TestRecord