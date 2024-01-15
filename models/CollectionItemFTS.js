
// Virtual table to support Full Text Search
// we effectively create a lookup table of 'indexed' cols synched w/ 'collection_items' table
// this class provides a single truth for the cols and weighting provided by this table.


class CollectionItemFTS {


   //
   // full_fields_list
   // Our methods return appropriate filtered arrays of eg 'field_names', and we build rows/forms/etc  
   // from these arrays in the renderer, so the order of this array is carried over to front-end views.
   //
   static #full_fields_list = [
      {key:'id',data_type:'INTEGER PRIMARY KEY',editable:false,in_card:false,export:true,test:{type:'int',min:1,max:9999999999}},
      {key:'title',data_type:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:3,max:100}},
      {key:'content_desc',data_type:'TEXT',editable:true,in_card:true,export:true,test:{type:'string',min:0,max:500}},
      {key:'tags',data_type:'TEXT',editable:true,in_card:false,export:true,test:{type:'string',min:0,max:200}},
   ]

   //
   // 'full_fields_list' is private - but clients can access a copy
   //
   static get_full_fields_list()  {
      let copy_fields_list = this.#full_fields_list.map((field) => {
         return field
      })
      return copy_fields_list
   }

   
   static get_ordered_weightings() {

      // return csv of weightings correspond to order of cols in collection_items_fts table: 
      // as ordered in this.#full_fields_list
      return '0,10,2,6'

   }

 

}


module.exports = CollectionItemFTS