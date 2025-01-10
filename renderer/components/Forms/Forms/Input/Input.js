import { create_input } from '../../../../utilities/ui_elements.js'


class Input {

   static render = (field,curr_field_value) => {      
   
      const field_input = create_input({
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
      if(field.placeholder) field_input.setAttribute('placeholder',field.placeholder)
      if(!field.editable) field_input.disabled = 'disabled'

      return field_input
   }
}

export default Input