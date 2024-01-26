import { create_div } from '../../utilities/ui_elements.js'



class Notification {

   static notify = (element_id,message,fade_out = true) => {

      if(message === '') return

      let target = document.getElementById(element_id)

      if(target) { 

         const notification_card = create_div({
            classlist:['notification_card'],
            text:message
         })
         target.append(notification_card) 
         if(fade_out) setTimeout(() => this.remove_notification(element_id),4000)
      }
   }

   static remove_notification = (element_id) => {

      let target = document.getElementById(element_id)
      if(target) {
         target.replaceChildren()
      }
   }

}



export default Notification