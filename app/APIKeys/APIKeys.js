

//
// APIKeys
// Provides specification for all Response and Request objects passed between main and renderer.
// Not static since we are happy to create on-the-fly and discard as we need rather than keep
// needlessly in memory.
//


class APIKeys {
   
   //
   // Registry of all Object.keys for our Responses
   //
   #request_obj_keys = {

   }

   //
   // Registry of all Object.keys for our Responses
   //
   #response_obj_keys = {

      // CollectionItem
      // to do : verify '_records' work for eg using Model or Batch for BatchesList
      read_collection_items:
         ["query","outcome","count","per_page","collection_item_fields","collection_items"],
      read_all_collection_items:
         ["query","outcome","count","collection_item_fields","collection_items"],
      read_single_collection_item:
         ["query","outcome","collection_item_fields","collection_item"],
      create_collection_item:
         ["query","outcome","collection_item"],
      create_collection_item_from_csv:
         ["query","outcome","collection_item"],
      update_collection_item:
         ["query","outcome","collection_item"],
      delete_collection_item:
         ["query","outcome"],
      restore_collection_item:
         ["query","outcome"],
      hard_delete_collection_item:
         ["query","outcome"],
      flush_deleted_collection_items:
         ["query","outcome"]
   }

   get_request_keys = (query_key) => {
      return this.#request_obj_keys[query_key]
   }

   get_response_keys = (query_key) => {
      return this.#response_obj_keys[query_key]
   }



}


module.exports = APIKeys