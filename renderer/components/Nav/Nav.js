import { app } from '../../renderer.js'
import { create_button } from '../../utilities/ui_elements.js'


class Nav {

   nav_items = [
      {component:'Home',label:'Home'},
      {component:'Files',label:'Files'},
      {component:'Search',label:'Search'},
      {component:'Browse',label:'Browse'},
      {component:'Tags',label:'Tags'},
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
   
   activate() {
      const select_page_buttons = document.querySelectorAll('.select_page_btn')
      if(select_page_buttons) {
         select_page_buttons.forEach((select_page_button) => {
            select_page_button.addEventListener('click',this.select_page)
         })
      }
   }

   select_page = (event) => {
      const component_name = event.target.attributes['data-component'].value
      this.highlight_selected(component_name)
      app.switch_to_component(component_name)
   }

   highlight_selected = (component_name) => {
      this.deselect_all()
      const target = document.body.querySelector(`.select_page_btn[data-component="${component_name}"]`)
      if(target) target.classList.add('selected_page')
   }
   deselect_all = (event) => {
      const select_page_buttons = document.querySelectorAll('.select_page_btn')
      if(select_page_buttons) {
         select_page_buttons.forEach((btn) => btn.classList.remove('selected_page'))
      }
   }

}


export default Nav