import { create_section, create_div, create_label } from '../../../utilities/ui_elements.js'
import TagsSelector from '../TagsSelector/TagsSelector.js'
import { ui_friendly_text } from '../../../utilities/ui_strings.js'


class TagsFormCtrl {

   static render = async(field,item,tags_obj,context) => {

      const container = create_section({
         classlist:['']
      })

      let field_label = create_label({
         attributes:[{key:'for',value:field.key}],
         text:ui_friendly_text(field.key)
      })
      const current_tags = (item) ?  item[field.key] ? item[field.key].split('*') : [] :  []

      // placeholder - we inject once promise is resolved..
      const tags_placeholder = create_div({attributes:[{key:'id',value:'tags_placeholder'}]})
      container.append(field_label,tags_placeholder)

      const tag_selector = new TagsSelector(tags_obj,current_tags)
      tags_placeholder.append(await tag_selector.render(context ? context : {}))
      setTimeout(() => tag_selector.activate(),200)

      return container
  }  

  // to do : review & enable or remove
  activate_tags = () => {
      
      // On change tag checkbox
      const tags_checkboxes = document.querySelectorAll('.tags_checkbox')
      if(tags_checkboxes) {
         tags_checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change',(event) => {
               const tags_input = document.getElementById('tags')
               if(tags_input) {
                  // get existing tags list (remove any non-registered tag tokens)
                  const curr_tags = tags_input.value.split('*').filter(e => e)
                  const verified_curr_tags = curr_tags.filter(curr_tag => {
                     // to do :
                     //  return this.#tags_obj.tags.some(tag => tag.tag === curr_tag)
                  })
                  const existing_tags = new Set(verified_curr_tags)
                  existing_tags.has(event.target.value) ? existing_tags.delete(event.target.value) : existing_tags.add(event.target.value)                    
                  tags_input.value = [...existing_tags].sort().join('*')    // build str w/ '*' delimiter
               }
            })
         })
      }
   }
}

export default TagsFormCtrl