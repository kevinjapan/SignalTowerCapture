import App from '../App/App.js'
import { create_div,create_button,create_section,create_heading } from '../../utilities/ui_elements.js'




class RecordAdmin {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {
     

      let record_admin = create_section({
         attributes:[
            {key:'id',value:'record_admin'}
         ]
      })
      
      const heading = create_heading({
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
         classlist:['delete_button'],
         text:'Delete'
      })
      
      let restore_btn = create_button({
         attributes:[
            {key:'id',value:'restore_btn'},
            {key:'data-id',value:typeof item !== 'undefined' ? item.id : null},
         ],
         classlist:['restore_button','hidden'],
         text:'Restore'
      })

      let outcome = create_div({
         attributes:[
            {key:'id',value:'outcome'}
         ]
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
            console.log('record_id',record_id)

            if(confirm('Are you sure you want to delete this record?')) {
               try {
                  const result = await window.collection_items_api.deleteCollectionItem(record_id)
                  const outcome = document.getElementById('outcome')
                  console.log('result',result)
                  console.log('still got item:',this.#props.item)
                  if(result.outcome === 'success'){
                     this.show_restore_btn()
                     outcome.innerText = result.message
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