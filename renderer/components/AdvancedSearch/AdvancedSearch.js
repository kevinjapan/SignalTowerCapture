import { 
   create_section,
   create_radio
} from '../../utilities/ui_elements.js'


class AdvancedSearch {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      const advanced_search = create_section({
         attributes:[
            {key:'id',value:'advanced_search'}
         ],
         classlist:['flex_col','mr_auto','p_3','border','hidden'],
         text:'Advanced Search sub-component'
      })

      let record_status_radio = create_radio({
         name:'record_status',
         text:'select record status',
         legend:'Record status',
         radio_buttons:[
            {key:'active_records',label:'Active Records',value:'active_records',checked:true},
            {key:'deleted_records',label:'Deleted Records',value:'deleted_records'},
         ]
      })


      

      // assemble
      advanced_search.append(record_status_radio)
      
      return advanced_search
   }

   // enable buttons/links displayed in the render
   activate = () => {

      const record_status_btns = document.querySelectorAll('input[name="record_status"]')

      if(record_status_btns) {

         record_status_btns.forEach((radio_btn) => {
            
            radio_btn.addEventListener('change',(event) => {
               this.#props.filter_search({
                  record_status:event.target.value
               })               
            })
         })
      }

      let search_filter = {

      }
      
      // this.#props.filter_search(search_filter)
      

   }
}


export default AdvancedSearch