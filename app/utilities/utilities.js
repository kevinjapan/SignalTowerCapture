

const get_random_int = (min_value = 5, max_value = 15) => {
   const value = min_value + Math.floor(Math.random() * (max_value - min_value))
   return value
}

// 
// Create assoc arr as obj from two 1-d arrays
//
const assoc_arr_obj = (arr_1,arr_2) => {

   let assoc_arr_obj = {}
   for(let i = 0; i < arr_1.length; i++) {
      assoc_arr_obj[arr_1[i]] = arr_2[i]
   }
   return assoc_arr_obj
}




module.exports = {
   get_random_int,
   assoc_arr_obj
}