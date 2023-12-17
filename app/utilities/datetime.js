

const get_sqlready_datetime = (inc_time = true) => {

   const d = new Date()
   let str = d.toISOString().split('T')[0] 
   if(inc_time) {
      str += ' ' + d.toTimeString().split(' ')[0]
   }
   return str
}


module.exports = {
   get_sqlready_datetime
}