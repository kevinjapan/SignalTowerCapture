import { app } from '../../../renderer.js'
import { create_ul,create_li,create_a } from '../../../utilities/ui_elements.js'



// wrapper for grid (list) of Cards
// returns container element for Cards and provides handler for click events


class CardContextMenu {

   #props

   #menu_items = [
      {key:'delete',label:'Delete this record'},
      {key:'tag',label:'Tag this record'}
   ]

   // to do : if Record is soft deleted, add 'Restore this record' link.

   constructor(props) {
      this.#props = props
   }

   render = () => {

      const menu = create_ul({
         attributes:[{key:'id',value:`context_menu_${this.#props.id}`}],
         classlist:['card_context_menu','absolute','z_100','w_full','h_100','m_0','text_left','bg_yellow']
      })


      this.#menu_items.forEach(item => {
         let li = create_li({
            classlist:['align_self_left','m_0','mt_1']            
         })
         li.append(create_a({
            attributes:[
               {key:'id',value:this.#props.id},
               {key:'data-title',value:this.#props.title},
               {key:'data-action',value:item.key}
            ],
            classlist:['card_context_menu_link'],
            text:item.label
         }))
         menu.append(li)
      })

      return menu
   }

   activate = () => {         
      const menu_items = document.querySelectorAll('.context_menu_item')   
      if(menu_items) {   
         menu_items.forEach(menu_item => {
            menu_item.addEventListener('click', async(event) => {
               console.log('you clicked context menu item') // to do :            
            })
         })
      }
   }

   close = () => {
      
      // to do : ensure we cleanly remove elements and associated listeners from DOM

   }
}



export default CardContextMenu