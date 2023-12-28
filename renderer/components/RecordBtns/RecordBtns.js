import { create_div,create_button } from '../../utilities/ui_elements.js'



class RecordBtns {

   static render = (item_id,has_context = true) => {
     
      const btn_group = create_div({
         classlist:['btn_grp']
      })

      const create_btn = create_button({
         attributes:[
            {key:'data-id',value:typeof item_id !== 'undefined' ? item_id : null},
         ],
         classlist:['edit_button'],
         text:'Edit'
      })

      let back_btn
      if(has_context) {
         back_btn = create_button({
            attributes:[
               {key:'data-id',value:typeof item_id !== 'undefined' ? item_id : null},
            ],
            classlist:['back_btn'],
            text:'Back'
         })
      }

      const open_folder_btn = create_button({
         attributes:[
            {key:'id',value:'open_folder_btn'}
         ],
         text:'Open Folder'
      })

      btn_group.append(create_btn,open_folder_btn)
      if(has_context) btn_group.append(back_btn)
      return btn_group
   }

}



export default RecordBtns