import { create_div,create_button } from '../../utilities/ui_elements.js'



class FormBtns {

   
   static render = (item = null,inc_cancel = true) => {
      
      const btn_group = create_div({
         attributes:[
            {key:'id',value:'btn_group'}
         ],
         classlist:['btn_grp']
      }) 

      const apply_btn = create_button({
         attributes:[
            {key:'data-id',value:item && typeof item !== 'undefined' ? item.id : null}
         ],
         classlist:['apply_btn','form_btn','dimmer'],
         text:'Apply'
      })
      btn_group.append(apply_btn)

      if(inc_cancel) {
         const cancel_btn = create_button({
            attributes:[
               {key:'data-id',value:item && typeof item !== 'undefined' ? item.id : null}
            ],
            classlist:['cancel_btn','form_btn'],
            text:'Cancel'
         })
         btn_group.append(cancel_btn)
      }

      return btn_group
   }

}



export default FormBtns