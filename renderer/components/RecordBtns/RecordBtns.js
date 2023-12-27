import { create_div,create_button } from '../../utilities/ui_elements.js'



class RecordBtns {

   static render = (item) => {

      console.log('RecordBtns',item)
     
      const btn_group = create_div({
         classlist:['btn_grp']
      })

      const create_btn = create_button({
         attributes:[
            {key:'data-id',value:typeof item !== 'undefined' ? item.id : null},
         ],
         classlist:['edit_button'],
         text:'Edit'
      })
      const back_btn = create_button({
         attributes:[
            {key:'data-id',value:typeof item !== 'undefined' ? item.id : null},
         ],
         classlist:['back_btn'],
         text:'Back'
      })

      const open_folder_btn = create_button({
         attributes:[
            {key:'id',value:'open_folder_btn'}
         ],
         text:'Open Folder'
      })

      btn_group.append(create_btn,open_folder_btn,back_btn)
      return btn_group
   }

}



export default RecordBtns