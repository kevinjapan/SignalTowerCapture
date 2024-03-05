import App from '../App/App.js'
import { create_div,create_button,create_section,create_h,create_p } from '../../utilities/ui_elements.js'
import Notification from '../../components/Notification/Notification.js'




class RecordAdmin {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {
     

      let record_admin = create_section({
         attributes:[
            {key:'id',value:'record_admin'}
         ],
         classlist:['border','grid_span_2']
      })
      
      const heading = create_h({
         level:'h3',
         text:'admin'
      })

      let btn_group = create_div({
         classlist:['btn_grp']
      })

      let item = this.#props.item
      let del_btn = create_button({
         attributes:[
            {key:'id',value:'del_btn'},
            {key:'data-id',value:typeof item !== 'undefined' ? item.id : null},
         ],
         classlist:['delete_button',`${this.#props.item['deleted_at'] ? 'hidden' : ''}`],
         text:'Delete'
      })
      
      let restore_btn = create_button({
         attributes:[
            {key:'id',value:'restore_btn'},
            {key:'data-id',value:typeof item !== 'undefined' ? item.id : null},
         ],
         classlist:['restore_button',`${this.#props.item['deleted_at'] ? '' : 'hidden'}`],
         text:'Restore'
      })


      const outcome = create_p({
         attributes:[
            {key:'id',value:'outcome'}
         ],
         classlist:['bg_yellow_100']
      })

      // assemble
      btn_group.append(del_btn,restore_btn)
      record_admin.append(heading,btn_group,outcome)
      return record_admin
   }

   activate = () => {

      // del
      const del_btn = document.getElementById('del_btn')
      if(del_btn) {

         del_btn.addEventListener('click',async() => {

            const record_id = del_btn.getAttribute('data-id')

            if(confirm('Are you sure you want to delete this record?')) {
               try {
                  const result = await window.collection_items_api.deleteCollectionItem(record_id)
                  const outcome = document.getElementById('outcome')
                  if(result.outcome === 'success'){
                     this.show_restore_btn()
                     Notification.notify('#outcome',result.message)
                  }
                  else {

                  }

               }
               catch(error) {
                  let props = {
                     msg:'Sorry, we were unable to delete the Record.',
                     error:error
                  }
                  App.switch_to_component('Error',props)
               }


               // redirect 'back'

            }
         })
      }

      
      // restore
      const restore_btn = document.getElementById('restore_btn')
      if(restore_btn) {

         restore_btn.addEventListener('click',async() => {

            try {
               const record_id = del_btn.getAttribute('data-id')
               const result = await window.collection_items_api.restoreCollectionItem(record_id)

               if(result.outcome === 'success'){
                  Notification.notify('#outcome',result.message)
                  restore_btn.classList.add('hidden')
               }
               else {
                  Notification.notify('#outcome',result.message)
               }
            }
            catch(error) {
               let props = {
                  msg:'Sorry, we were unable to delete the Record.',
                  error:error
               }
               App.switch_to_component('Error',props)
            }
         })

      }
   }

   show_restore_btn = () => {
      const restore_btn = document.getElementById('restore_btn')
      if(restore_btn) {
         restore_btn.classList.remove('hidden')
      }
   }

}



export default RecordAdmin