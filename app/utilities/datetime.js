

//
//
//
const get_sqlready_datetime = (inc_time = true) => {

   const d = new Date()
   let str = d.toISOString().split('T')[0] 
   if(inc_time) {
      str += ' ' + d.toTimeString().split(' ')[0]
   }
   return str
}

//
//
//
const get_sqlready_date_from_js_date = (date_obj) => {
   if(date_obj instanceof Date && !isNaN(date_obj)) {
      let str = date_obj.toISOString().split('T')[0] 
      return str
   }
   return ''
}

//
// Calcs days btwn two dates - assumes 'today' for 2nd param if not given
//
const days_between = (start,end = new Date()) => {
   const date_1 = new Date(start)
   const date_2 = new Date(end)
   const ms_diff = date_2.getTime() - date_1.getTime()
   return Math.round(ms_diff / (1000 * 60 * 60 * 24)) 
}


module.exports = {
   get_sqlready_datetime,
   get_sqlready_date_from_js_date,
   days_between
}