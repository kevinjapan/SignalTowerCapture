import { create_ul,create_li,create_a } from '../../../utilities/ui_elements.js'




class CardContextMenu {

   #props

   // menu_items appear in all|active|deleted record states
   #menu_items = [
      {key:'delete',label:'Delete this record',status:'active'},
      {key:'restore',label:'Restore this record',status:'deleted'}
      // {key:'tag',label:'Tag this record',status:'all'}  // future : 'tag record' in context_menu
   ]

   // to do : if Record is soft deleted, switch 'Delete..' to  'Restore this record' link.

   constructor(props) {
      this.#props = props
   }

   render = () => {

      let filtered_menu_items = []

      // filter menu_items on current Card status
      const card_status = this.#props.deleted_at === null ? 'active' : 'deleted'      
      filtered_menu_items = this.#menu_items.filter(item => {
         return item.status === card_status || item.status === 'all'
      })

      const menu = create_ul({
         attributes:[{key:'id',value:`context_menu_${this.#props.id}`}],
         classlist:['card_context_menu','absolute','z_100','w_full','h_100','m_0','text_left','bg_white']
      })
      filtered_menu_items.forEach(menu_item => {
         let li = create_li({
            classlist:['align_self_left','m_0','mt_1']            
         })
         li.append(create_a({
            attributes:[
               {key:'id',value:this.#props.id},
               {key:'data-title',value:this.#props.title},
               {key:'data-action',value:menu_item.key}
            ],
            classlist:['card_context_menu_link'],
            text:menu_item.label
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
      // future : ensure we cleanly remove elements and associated listeners from DOM
   }
}



export default CardContextMenu