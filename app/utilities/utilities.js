

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


const remove_ext = (file_name) => {
   return file_name.replace(/\.[^/.]+$/, "")
}

//
// we auto-gen titles from file_names
//
const title_from_file_name = (file_name) => {

   let temp = remove_ext(file_name)
   
   // separate on '-' and '_'
   let candidate = temp.replaceAll('-',' ').replaceAll('_',' ')

   // separate on uppercase chars
   let candidate_arr = candidate.match(/[A-Z]+[^A-Z]*|[^A-Z]+/g)

   return candidate_arr.join(' ')
}


module.exports = {
   get_random_int,
   assoc_arr_obj,
   title_from_file_name
}