
import { create_div, create_label, create_radio_fieldset } from '../../../utilities/ui_elements.js'
import { DESC } from '../../../utilities/ui_descriptions.js'
import { ui_friendly_text } from '../../../utilities/ui_strings.js'




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

      const container = create_div()
      
      const file_type_checkbox = create_div({
         attributes:[{key:'id',value:'file_type_checkbox'}]
      })

      let field_label = create_label({
         attributes:[{key:'for',value:field.key}],
         text:ui_friendly_text(field.key)
      })
      const file_type_radio = create_radio_fieldset({
         name:'file_type_radio_btns',
         classlist:['m_0'],
         radio_buttons:[
            {key:'file',label:'Single PDF,JPG or other file',value:'File',checked:curr_field_value.toUpperCase() === 'FILE' ? true : false},
            {key:'folder',label:'Folder of multiple PDF,JPG or other files',value:'Folder',checked:curr_field_value.toUpperCase() === 'FOLDER' ? true : false}
         ]
      })               
      const file_type_info = create_div({
         attributes:[{key:'id',value:'file_type_info'}],
         classlist:['text_grey','border','rounded','','p_1'],
         text:curr_field_value.toUpperCase() === 'FILE' ? DESC.FILE_ITEM_FILETYPE : DESC.FOLDER_ITEM_FILETYPE
      })
      file_type_checkbox.append(field_label,file_type_radio,create_div(),file_type_info)


      container.append(file_type_checkbox)
      

      // activate after rendering delay
      setTimeout(() => FileTypeCtrl.activate(),200)

      return container
   }  
  
   static activate = () => {
      
      // On change file_type radio btn
      const file_type_radio_btns = document.querySelectorAll('input[name="file_type_radio_btns"]')
      if(file_type_radio_btns) {
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