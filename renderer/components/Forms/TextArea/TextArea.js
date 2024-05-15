import { create_textarea } from '../../../utilities/ui_elements.js'


class TextArea {
   
   static render = (field,curr_field_value) => {

      const field_input = create_textarea({
         attributes:[
            {key:'id',value:field.key},
            {key:'name',value:field.key},
            {key:'type',value:'text'},
            {key:'value',value:curr_field_value},
            {key:'maxlength',value:field.test.max},
            {key:'readonly',value:field.readonly ? 'readonly' : false},
         ],
         classlist:['input_field']
      })
      if(field.hidden === true) field_input.hidden = true
      field_input.value = curr_field_value   // req for textareas
      field_input.style.height = field.test.max > 200 ? '16rem' : '4.25rem'
      if(field.placeholder) field_input.setAttribute('placeholder',field.placeholder)
      if(!field.editable) field_input.disabled = 'disabled'
    
      return field_input
   }
}

export default TextArea