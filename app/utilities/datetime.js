

const get_sqlready_datetime = (inc_time = true) => {

   const d = new Date()
   let str = d.toISOString().split('T')[0] 
   if(inc_time) {
      str += ' ' + d.toTimeString().split(' ')[0]
   }
   return str
}

const get_sqlready_date_from_js_date = (date) => {
   // to do : check date is valid.
   let str = date.toISOString().split('T')[0] 
   return str
}


module.exports = {
   get_sqlready_datetime,
   get_sqlready_date_from_js_date
}