
import { create_section, create_div, create_button } from '../../../utilities/ui_elements.js'


class FindFileBtn {

   static render = (find_files) => {

      const container = create_section()

      let find_file_outcome = create_div({
         attributes:[{key:'id',value:'find_file_outcome'}],
         classlist:['mb_1']
      })
      container.append(create_div(),find_file_outcome)
      if(find_files) {
         const find_file_btn_row = create_div({classlist:['text_center']})
         let find_file_btn = create_button({
            attributes:[{key:'id',value:'find_file_btn'}],
            classlist:['form_btn','mx_auto'],
            text:'Find File'
         })
         find_file_btn_row.append(find_file_btn)
         container.append(create_div(),find_file_btn_row)
      }
      return container
   }  
}

export default FindFileBtn