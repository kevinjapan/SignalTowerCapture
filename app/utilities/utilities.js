

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


//
// Break array into array of arrays of chunk_size
//
const chunk_array = (arr,chunk_size) => {
   let chunked = []
   for(let i = 0; i < arr.length; i += chunk_size) {
      chunked.push(arr.slice(i,i + chunk_size))
   }
   return chunked
}


const remove_ext = (file_name) => {
   return file_name.replace(/\.[^/.]+$/, "")
}

const file_name_from_path = (file_path) => {
   return file_path.substring(file_path.lastIndexOf('\\') + 1)
}

//
// we auto-gen titles from file_names
// mirrors complementary in ui_utilities.js
//
const title_from_file_name = (file_name) => {

   let temp = remove_ext(file_name).trim()
   
   // separate on '-' and '_'
   let candidate = temp.replaceAll('-',' ').replaceAll('_',' ')

   // separate on uppercase chars
   let candidate_arr = candidate.match(/[A-Z]+[^A-Z]*|[^A-Z]+/g)

   return candidate_arr.join(' ')
}


module.exports = {
   get_random_int,
   assoc_arr_obj,
   chunk_array,
   title_from_file_name,
   file_name_from_path
}