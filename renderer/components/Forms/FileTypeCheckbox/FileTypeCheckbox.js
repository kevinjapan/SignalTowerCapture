import { create_div,create_label,create_button,create_radio_fieldset} from '../../../utilities/ui_elements.js'
import { ui_friendly_text } from '../../../utilities/ui_strings.js'
import { DESC } from '../../../utilities/ui_descriptions.js'


// we currently assume there will only ever be one FileTypeCheckbox per page (so, 'find_file_btn' is not duplicated)


class FileTypeCheckbox {

   static render = (field_key,curr_field_value) => {

      const file_type_checkbox = create_div({attributes:[{key:'id',value:'file_type_checkbox'}]})

      let field_label = create_label({
         attributes:[
            {key:'for',value:field_key}
         ],
         text:ui_friendly_text(field_key)
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
         attributes:[
            {key:'id',value:'file_type_info'}
         ],
         classlist:['text_grey','border','rounded','mb_3','p_1'],
         text:curr_field_value.toUpperCase() === 'FILE' ? DESC.FILE_ITEM_FILETYPE : DESC.FOLDER_ITEM_FILETYPE
      })
      file_type_checkbox.append(field_label,file_type_radio,create_div(),file_type_info)

      let find_file_outcome = create_div({
         attributes:[
            {key:'id',value:'find_file_outcome'}
         ]
      })

      // btn to select file for 'file_name' field
      let find_file_btn = create_button({
         attributes:[
            {key:'id',value:'find_file_btn'}
         ],
         classlist:['form_btn'],
         text:'Find File'
      })
      
      // assemble find_file
      file_type_checkbox.append(create_div(),find_file_btn,create_div(),find_file_outcome)
      return file_type_checkbox
   }
}

export default FileTypeCheckbox