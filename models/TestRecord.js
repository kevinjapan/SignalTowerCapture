const CollectionItem = require('./CollectionItem')
const { get_sqlready_datetime } = require('../app/utilities/datetime')
const { get_random_test_string } = require('../app/utilities/strings')
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

      const insert_placeholders = ci_full_fields_list.map(() => {
         return '?'
      })


      let field_values

      this.#database.serialize(() => {

         // insert into CollectionItems table

         let stmt = this.#database.prepare(`INSERT INTO collection_items (${ci_full_fields_list}) VALUES (${insert_placeholders.toString()})`)

         // we typically run in dev, so let's verify workings..
         // console.log(`INSERT INTO collection_items (${ci_full_fields_list}) VALUES (${insert_placeholders.toString()})`)

         for (let i = 0; i < num_records; i++) {
            
            // build values list - eg ["bar",2,"maryland ohio"]
            field_values = no_id_list.map((field) => {
               switch(field.test.type) {
                  case 'date':

                     // exclude time from 'item_date'
                     let datetime = get_sqlready_datetime(Date())
                     datetime = datetime.length > field.test.max ? datetime.substring(0,field.test.max) : datetime

                     return field.key === 'deleted_at' ? null : datetime

                  case 'string':

                     return get_random_test_string()

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