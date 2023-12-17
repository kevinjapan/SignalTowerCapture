import { truncate } from './ui_strings.js'


//
// Display on UI - '16 Mar 2023'
// 
export function get_ui_ready_date (d,inc_day = false) {

   if(d === undefined || d === null || d === '') return ''
   let ui_date = new Date(d)
   const months = {0:'Jan',1:'Feb',2:'Mar',3:'Apr',4:'May',5:'Jun',6:'Jul',7:'Aug',8:'Sep',9:'Oct',10:'Nov',11:'Dec'}
   let result = inc_day ? get_day(ui_date.getDay()) : ''
   result+= " " + ui_date.getDate() + " " + months[ui_date.getMonth()] + " " + ui_date.getFullYear()
   return result
}

//
// Display on UI - '12:27:50'
// 
export function get_ui_ready_time(d) {
   if(d === undefined || d === null || d === '') return ''
   let ui_date = new Date(d)
   return ui_date.getHours() + ':' + ui_date.getMinutes() + ':' + ui_date.getSeconds()
}


// 
// Get day by index - days are 0 indexed
//
export const get_day = (days_index,num_chars = 3) => {
   const days = [
      "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
   ]
   return truncate(days[days_index],num_chars,false)
}