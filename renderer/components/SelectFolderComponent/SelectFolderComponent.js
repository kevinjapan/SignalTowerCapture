import { create_button } from '../../utilities/ui_elements.js'



class SelectFolderComponent {

   render = (input_id) => {

      if(input_id) {
         return create_button({
            attributes:[
               {key:'id',value:`${input_id}_btn`}
            ],
            text:`Select Folder`
         })
      }
   }

   activate = (input_id) => {

      let select_export_btn = document.getElementById(`${input_id}_btn`)
      let target_input = document.getElementById(input_id)

      if(select_export_btn && target_input) {

         select_export_btn.addEventListener('click', async (event) => {
            event.preventDefault()
            let folder_path = await window.files_api.getFolderPath()
            if(folder_path && folder_path !== '') {
               target_input.value = folder_path
            }
         })
      }
   }
}


export default SelectFolderComponent