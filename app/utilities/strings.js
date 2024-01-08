

// for generating test records..s
const get_random_string = (min_len = 5, max_len = 25) => {

   let str = ''
   let last_char = ''

   const chars = "abcdefghijklmnopqrstuvwxyz   "      // more spaces to incrse likelyhood of 'words'
   const length = min_len + Math.floor(Math.random() * (max_len - min_len))
   for(let i = 0; i < length; i++) {
      let random_num = Math.floor(Math.random() * chars.length)

      // avoid contiguous ' ' chars
      let char = chars.substring(random_num,random_num + 1)
      if(char === ' ' && last_char === ' ') {
         i--   // try again
      }
      else {
         str += char
      }
      last_char = char
   }
   return str.trim()
}


//
// is valid tag
// future : any other checks here?
//
const is_valid_tag = (tag) => {

   if(typeof tag.tag !== 'string') return false
   
   if(tag.tag.length >= 3 && tag.tag.length <= 24) {
      return true
   }
   return false
}


module.exports = {
   get_random_string,
   is_valid_tag
}