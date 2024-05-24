import { create_div,create_p,create_button } from '../../utilities/ui_elements.js'

// parameters
// elem_selector  - display element on current page
// messages       - array of strings displayed in seperate <p> elements
// classes        - modifed esp bg_color
// fade_out       - defaults to fading out, set to false for errors

class Notification {

   static notify = (elem_selector,messages,classes = [],fade_out = true) => {

      if(messages === undefined || messages === '' ) return
      if(typeof messages === 'string') messages = [messages]
      if(!Array.isArray(messages)) return

      // default is warning
      if(!Array.isArray(classes) || classes.length === 0) classes = ['bg_yellow_300']
      
      const elem_selectors = document.querySelectorAll(elem_selector)
      if(elem_selectors) {
         elem_selectors.forEach(elem => {
            elem.replaceChildren()
            const notification_card = create_div({
               classlist:['notification',...classes,'p_1']
            })
            messages.forEach(msg => {
               notification_card.append(create_p({classlist:['p_0.5','m_0'],text:msg}))
            })
            notification_card.append(this.get_ctrls())
            elem.append(notification_card) 
            if(fade_out) setTimeout(() => this.remove_notification(elem_selector),7000)
         })
      }
      this.activate_ctrls(elem_selector)
   }

   static remove_notification = (elem_selector) => {
      const elem_selectors = document.querySelectorAll(elem_selector)
      if(elem_selectors) {
         elem_selectors.forEach(elem => {
            elem.replaceChildren()
         })
      }
   }

   static get_ctrls = () => {
      const ctrls = create_div({
         classlist:['flex','justify_center','p_1']
      })
      const remove_btn = create_button({
         attributes:[{key:'id',value:'remove_notification_btn'}],
         text:'Remove Notification'
      })
      ctrls.append(remove_btn)
      return ctrls
   }

   static activate_ctrls = (elem_selector) => {
      const remove_notification_btn = document.getElementById('remove_notification_btn')
      if(remove_notification_btn) {
         remove_notification_btn.addEventListener('click', async(event) => {
            const elem_selectors = document.querySelectorAll(elem_selector)
            if(elem_selectors) {
               elem_selectors.forEach(elem => {
                  elem.innerText = ''
               })
            }
         })
      }
   }
}


export default Notification