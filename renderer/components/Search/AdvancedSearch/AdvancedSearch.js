import { create_section,create_radio_fieldset } from '../../../utilities/ui_elements.js'


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
         classlist:['flex','m_0','p_0','hidden']
      })

      const record_status_radio = create_radio_fieldset({
         name:'record_status',
         classlist:['m_0'],
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
   }

}


export default AdvancedSearch