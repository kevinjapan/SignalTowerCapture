

export const ui_friendly_text = (text) => {
   text = text.charAt(0).toUpperCase() + text.slice(1)
   return text.replaceAll('_',' ')
}


export const truncate = (str,len,trailing = true) => {
   if(str) {
   if(str !== "" && str.length > len) {
      return trailing ? str.substring(0, len) + '..' : str.substring(0, len) 
      }
   }
   return str
}


export const escape_html = (str) => {
   return str
      .replaceAll('&', "&amp;")
      .replaceAll('<', "&lt;")
      .replaceAll('>', "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")
}


// insert ',' in large nums - eg '1,345' (handles up to 999,999,999)
export const ui_display_number_as_str = (num) => {

   let temp = ''
   if(num > 999999) {
      temp = num.toString()
      return temp.slice(0,-6) + ',' + temp.slice(-6,-3)  + ',' + temp.slice(-3,temp.length)
   }
   else if(num > 999) {
      temp = num.toString()
      return temp.slice(0,-3) + ',' + temp.slice(-3,temp.length)
   }
   return num
}

export const extract_file_name = (full_path) => {

   return full_path.substring(full_path.lastIndexOf('\\')+1)

}

//
// is valid tag
//
export const is_valid_tag = (tag) => {

   if(typeof tag !== 'string') return false
   
   if(tag.length >= 3 && tag.length <= 24) {
      return true
   }
   return false
}


//
// trim_char
//
export const trim_char = (str,delim) => {
   let temp = trim_end_char(str,delim)
   return temp.startsWith(delim) ? temp.slice(1) : temp
}

//
// trim_end_char
//
export const trim_end_char = (str,delim) => {
   return str.endsWith(delim) ? str.slice(0,-1) : str
}

//
// trim_start_char
//
export const trim_start_char = (str,delim) => {
   return str.startsWith(str,delim) ? str.slice(1) : str
}