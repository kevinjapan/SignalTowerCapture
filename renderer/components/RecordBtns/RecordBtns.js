import { create_div,create_button } from '../../utilities/ui_elements.js'



class RecordBtns {

   static render = (item_id) => {

      const btn_group = create_div({
         classlist:['btn_grp']
      })

      const create_btn = create_button({
         attributes:[{key:'data-id',value:typeof item_id !== 'undefined' ? item_id : null},],
         classlist:['edit_button','form_btn'],
         text:'Edit'
      })

      const open_folder_btn = create_button({
         classlist:['open_folder_btn','form_btn'],
         text:'Open Folder'
      })

      btn_group.append(create_btn,open_folder_btn)
      return btn_group
   }
}

export default RecordBtns