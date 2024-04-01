import { create_div } from '../../utilities/ui_elements.js'



class Notification {

   static notify = (elem_selector,message,classes = [],fade_out = true) => {

      if(message === '' ) return

      // default is warning
      if(!Array.isArray(classes) || classes.length === 0) classes = ['bg_yellow_300']
      
      const elem_selectors = document.querySelectorAll(elem_selector)
      if(elem_selectors) {
         elem_selectors.forEach(elem => {
            const notification_card = create_div({
               classlist:['notification',...classes,'p_1'],
               text:message
            })
            elem.replaceChildren(notification_card) 
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