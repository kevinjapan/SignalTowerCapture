import { create_div,create_p } from '../../utilities/ui_elements.js'



class Notification {

   static notify = (elem_selector,message_arr,classes = [],fade_out = true) => {

      if(message_arr === undefined || message_arr === '' ) return
      if(typeof message_arr === 'string') message_arr = [message_arr]
      if(!Array.isArray(message_arr)) return

      // default is warning
      if(!Array.isArray(classes) || classes.length === 0) classes = ['bg_yellow_300']
      
      const elem_selectors = document.querySelectorAll(elem_selector)
      if(elem_selectors) {
         elem_selectors.forEach(elem => {
            elem.replaceChildren()
            const notification_card = create_div({
               classlist:['notification',...classes,'p_1']
            })
            message_arr.forEach(msg => {
               notification_card.append(create_p({text:msg}))
            })

            elem.append(notification_card) 
            if(fade_out) setTimeout(() => this.remove_notification(elem_selector),7000)
         })
      }
   }

   static remove_notification = (elem_selector) => {

      const elem_selectors = document.querySelectorAll(elem_selector)
      if(elem_selectors) {
         elem_selectors.forEach(elem => {
            elem.replaceChildren()
         })
      }
   }

}


export default Notification