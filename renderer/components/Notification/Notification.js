

// to do : make this fade in and out - use classlist..   

class Notification {

   static notify = (element_id,message,fade_out = true) => {

      if(message === '') return

      let target = document.getElementById(element_id)
      if(target) {            
         target.innerText = message         
         if(fade_out) setTimeout(() => this.remove_notification(element_id),4000)
      }
   }

   static remove_notification = (element_id) => {

      let target = document.getElementById(element_id)
      if(target) {
         target.innerText = ''
      }
   }

}



export default Notification