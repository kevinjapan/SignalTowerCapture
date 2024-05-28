import { app } from '../../renderer.js'
import { create_button } from '../../utilities/ui_elements.js'


class Nav {

   nav_items = [
      {component:'Home',label:'Home'},
      {component:'Browse',label:'Browse'},
      {component:'Search',label:'Search'},
      {component:'Tags',label:'Tags'},
      {component:'Files',label:'Files'},
   ]

   init = () => {

      const nav = document.getElementById('nav')

      const history = app.get_service('history')
      nav.appendChild(history.render())

      if(nav) {
         // build each nav item
         this.nav_items.forEach((nav_item) => {            
            nav.appendChild(create_button({
               attributes:[{key:'data-component',value:nav_item.component}],
               classlist:['select_page_btn',`${nav_item.component === 'Home' ? 'selected_page' : ''}`],
               text:nav_item.label
            }))
         })
      }
   }
   
   async activate(callback) {
      const select_page_buttons = document.querySelectorAll('.select_page_btn')
      if(select_page_buttons) {
         select_page_buttons.forEach((select_page_button) => {
            select_page_button.addEventListener('click', (event) => {
               // highlight selected
               select_page_buttons.forEach((btn) => btn.classList.remove('selected_page'))
               select_page_button.classList.add('selected_page')

               // send selected menu key (label) to client
               callback(event.target.attributes['data-component'].value)
            })
         })
      }
   }

}


export default Nav