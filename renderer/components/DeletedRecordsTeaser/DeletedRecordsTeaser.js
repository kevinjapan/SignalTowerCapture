import App from '../App/App.js'
import { 
   create_div,
   create_h,
   create_p,
   create_button
} from '../../utilities/ui_elements.js'


class DeletedRecordsTeaser {

   render = () => {


      const deleted_Records_component = create_div({
         attributes:[
            {key:'id',value:'deleted_Records_component'}
         ],
         classlist:['ui_component']
      })

      const heading = create_h({
         level:'h3',
         text:'Deleted Records'
      })

      let desc_text =`
      Deleted records are kept within the database to permit restoration and recovery,
      although they are not included in the Browse or Search results lists.
      You can recover a deleted record by searching through all the previously deleted records here.
      You should ensure the number of deleted records never gets too large.`

      const desc = create_p({
         text:desc_text
      })

      const open_btn = create_button({
         attributes:[
            {key:'id',value:'open_btn'}
         ],
         text:'Open'
      })

      // assemble
      deleted_Records_component.append(heading,desc,open_btn)

      return deleted_Records_component

   }

   // enable buttons/links displayed in the render
   activate = () => {

      const open_btn = document.getElementById('open_btn')
      if(open_btn) {
         open_btn.addEventListener('click',() => {
            App.switch_to_component('DeletedRecords')
         })
      }

   }
}



export default DeletedRecordsTeaser