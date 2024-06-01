//
// we introduce some known 'keywords' for testing
//
const seed_words = ['gnu','eland','impala','coffee','desk','desktop','gnu','gnu','grants','eland']


//
// for generating test records..
//
const get_random_test_string = (min_len = 5, max_len = 25) => {

   let str = ''
   let last_char = ''

   const chars = "abcdefghijklmnopqrstuvwxyz   "      // more spaces to incrse likelyhood of 'words'
   const length = min_len + Math.floor(Math.random() * (max_len - min_len))

   // use seed every approx 10th time
   let check = Math.floor(Math.random() * 10)

   if(check === 0) {
      str = seed_words[Math.floor(Math.random() * seed_words.length)]
   }
   else {
      // build random test str
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
   }

   return str.trim()

}


//
// is valid tag
//
const is_valid_tag = (tag) => {

   if(typeof tag.tag !== 'string') return false
   
   if(tag.tag.length >= 3 && tag.tag.length <= 24) {
      return true
   }
   return false
}


//
// trim_char
//
const trim_char = (str,delim) => {
   let temp = trim_end_char(str,delim)
   return temp.startsWith(delim) ? temp.slice(1) : temp
}

//
// trim_end_char
//
const trim_end_char = (str,delim) => {
   if(str !== undefined) {
      return str.endsWith(delim) ? str.slice(0,-1) : str
   }
   return str
}

//
// trim_start_char
//
const trim_start_char = (str,delim) => {
   return str.startsWith(str,delim) ? str.slice(1) : str
}

//
// Split string on ',' exluding ',' within double-quotes
//
const split_csv_ignore_quoted = (str) => {

   // we inject a temp unique placeholder
   const placeholder = '4590_CSV_PLACEHOLDER_%$'

   const replace_comma = s => s.replace(',',placeholder)
   const replace_placeholder = s => s.replace(placeholder,',')

   // select quoted token
   const double_quote_regex = /\".*\"/gi

   // replace commas w/in double quoted tokens
   // future - review - code from stackoverflow - works but not sure of use of replace_comma
   //          replace() second parameter can be a function, called for every match
   const clean_str = str.replace(double_quote_regex,replace_comma)
   const tokens = clean_str.split(',')
   const clean_tokens = tokens.map(replace_placeholder)   

   // remove any enclosing double-quotes - packaging for ',' containing strings - trips str handling later if left
   let dequoted_clean_tokens = []
   clean_tokens.forEach(token => {
      dequoted_clean_tokens.push(token.replaceAll('\"',''))
   })
   return dequoted_clean_tokens
}



module.exports = {
   get_random_test_string,
   is_valid_tag,
   trim_char,
   trim_end_char,
   trim_start_char,
   split_csv_ignore_quoted
}