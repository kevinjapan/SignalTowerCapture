import { create_div,create_button } from '../../utilities/ui_elements.js'



class RecordBtns {

   static render = (item) => {
     
      let btn_group = create_div({
         classlist:['btn_grp']
      })

      let create_btn = create_button({
         attributes:[
            {key:'data-id',value:typeof item !== 'undefined' ? item.id : null},
         ],
         classlist:['edit_button'],
         text:'Edit'
      })
      let back_btn = create_button({
         attributes:[
            {key:'data-id',value:typeof item !== 'undefined' ? item.id : null},
         ],
         classlist:['back_btn'],
         text:'Back'
      })

      btn_group.append(create_btn,back_btn)
      return btn_group
   }

}



export default RecordBtns