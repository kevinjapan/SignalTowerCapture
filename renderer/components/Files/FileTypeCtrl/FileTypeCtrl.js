
import { create_section, create_div } from '../../../utilities/ui_elements.js'
import FileTypeCheckBox from '../../Forms/Forms/FileTypeCheckbox/FileTypeCheckbox.js'
import { DESC } from '../../../utilities/ui_descriptions.js'




class FileTypeCtrl {

   // we check targeted files are in valid location
   static #root_folder

   // the record item
   static #item

   // 'add' or 'update' record
   static #action


   static render = async(action,root_folder,item,field,curr_field_value) => {

      FileTypeCtrl.#root_folder = root_folder
      FileTypeCtrl.#item = item
      FileTypeCtrl.#action = action

      const container = create_section()
      container.append(create_div(),FileTypeCheckBox.render(field.key,curr_field_value))
      return container
   }  
  
   static activate = () => {
      
      // On change file_type radio btn
      // to do : bug - on refactoring, this not working now
      const file_type_radio_btns = document.querySelectorAll('input[name="file_type_radio_btns"]')
      if(file_type_radio_btns) {

         // to do : bug : we don't get 'file_type_radio_btns'
               console.log('it changed file_typer')  

         file_type_radio_btns.forEach((radio_btn) => {            
            radio_btn.addEventListener('change',(event) => {        
               const file_type = document.getElementById('file_type')
               if(file_type) file_type.value = event.target.value   
               const file_type_info = document.getElementById('file_type_info')
               if(file_type_info) file_type_info.innerText = event.target.value === 'File' ? DESC.FILE_ITEM_FILETYPE : DESC.FOLDER_ITEM_FILETYPE
            })
         })
      }


   }
}

export default FileTypeCtrl