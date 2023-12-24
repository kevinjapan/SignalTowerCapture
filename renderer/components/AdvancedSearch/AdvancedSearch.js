import { 
   create_section,
   create_form,
   create_button,
   create_input,
   create_h,
   create_div
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

      
      // to do : add checklist ctrls 
      // let checklist = create_checklist({
      //    options:[
      //       {key:'deleted',label:'Recently deleted records'},
      //       {key:'peope',label:'People/author'},
      //       {key:'location',label:'location '},
      //       {key:'type',label:'images only'},  // offer several options
      //       {key:'desc',label:'include description'},  s
      //    ]
      // })
      // tags ?
      

      // assemble
      
      return advanced_search
   }

   // enable buttons/links displayed in the render
   activate = () => {

      

   }
}


export default AdvancedSearch