
import Input from '../../Forms/Forms/Input/Input.js'
import TextArea from '../../Forms/Forms/TextArea/TextArea.js'
import { create_div, create_label } from '../../../utilities/ui_elements.js'
import { ui_friendly_text } from '../../../utilities/ui_strings.js'


class CollectionItemFormRow {

   static render = (field,curr_field_value) => {

      const form_row = create_div({classlist:['collection_item_form_row']})
    
      // build the row label
      let field_label = create_label({
         attributes:[{key:'for',value:field.key}],
         text:ui_friendly_text(field.key)
      })

      // build the row input
      let field_input = (field.test.type === 'string' && field.test.max > 120) 
         ?  TextArea.render(field,curr_field_value)
         :  Input.render(field,curr_field_value)            

      // build the row error notification
      let field_error = create_div({
         attributes:[{key:'id',value:`${field.key}_error`}],
         classlist:['error_bar','bg_yellow']
      })

      // build the row stats
      let field_stats = create_div({
         classlist:['field_info'],
         text:`max ${field.test.max} chars`
      })

      // assemble current row
      if(field.hidden !== true) form_row.append(field_label)
      form_row.append(field_input)
      if(field.editable && field.hidden !== true) form_row.append(create_div(),field_stats)
      form_row.append(create_div(),field_error)

      return form_row
   }
}



export default CollectionItemFormRow