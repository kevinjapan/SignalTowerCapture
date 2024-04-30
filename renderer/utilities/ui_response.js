// Validate Responses received from main process



//
// Validate the Response obj for the given query_key
//
export const is_valid_response_obj = async(query_key,response) => {
   const response_keys = Object.keys(response)
   const expected_keys = await window.app_api.getResponseObjectKeys(query_key)
   return is_subset_array(expected_keys.keys,response_keys)
}


//
// Tests if first array is a subset (therefore first is fully matched) of the second.
// 1-d arrays of primitives only. Using .every() method removes any dependancy on order.
//
const is_subset_array = (potential_subset_arr,main_arr) => {
   return potential_subset_arr.every(elem => main_arr.includes(elem))
}


//
// Tests if arrays match exactly.
// 1-d arrays of primitives only.
//
const is_matching_array = (arr_1,arr_2) => {

   if(arr_1.length !== arr_2.length) return false

   // future : on-going - not used in anger yet!
 
   // option #1
   // JSON.stringify(arr_1.toSorted()) === JSON.stringify(arr_2.toSorted())

   // option #2
   // arr_1.toSorted().join(',')=== arr_2.toSorted().join(',')

   // review
   // - verify toSorted() working correctly (cd sort() which modifies original order)
   // - both above methods ok for primitive single-d arrays
   // - stringify won't handle differentiate btwn null or undefind (JSON converts undefined -> null)
}




