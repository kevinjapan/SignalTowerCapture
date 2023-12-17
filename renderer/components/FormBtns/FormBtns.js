import { create_div,create_button } from '../../utilities/ui_elements.js'



class FormBtns {

   static render = (item) => {
      
      const btn_group = create_div({
         attributes:[
            {key:'id',value:'btn_group'}
         ],
         classlist:['btn_grp']
      }) 

      const apply_btn = create_button({
            attributes:[
               {key:'data-id',value:typeof item !== 'undefined' ? item.id : null}
            ],
            classlist:['apply_btn'],
            text:'Apply'
         })

      const cancel_btn = create_button({
            attributes:[
               {key:'data-id',value:typeof item !== 'undefined' ? item.id : null}
            ],
            classlist:['cancel_btn'],
            text:'Cancel'
         })

      // assemble
      btn_group.append(apply_btn,cancel_btn)
      return btn_group
   }

}



export default FormBtns