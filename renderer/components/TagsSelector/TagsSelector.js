import Notification from '../../components/Notification/Notification.js'
import { create_div,create_checkbox_fieldset,create_button} from '../../utilities/ui_elements.js'



class TagsSelector {

   #tags_obj

   #current_tags


   constructor(tags_obj,current_tags) {
      this.#tags_obj = tags_obj
      this.#current_tags = current_tags
   }

   render = async(context) => {

      const tags_selector_elem = create_div()

      try {
         this.#tags_obj = await window.tags_api.getTags(context)

         if (typeof this.#tags_obj !== "undefined") {
      
            if(this.#tags_obj.outcome === 'success') {

               // get existing tags list (remove any non-registered tag tokens)
               const verified_curr_tags = this.#current_tags.filter(curr_tag => {
                  return this.#tags_obj.tags.some(tag => tag.tag === curr_tag)
               })

               const tags_checks = this.#tags_obj.tags.map(tag => {
                  return {
                     key:tag.tag,
                     value:tag.tag,
                     checked: verified_curr_tags.some(current_tag => {
                        return tag.tag === current_tag
                     }) ? 'checked' : null
                  }
               })

               const tags_checkboxes = create_checkbox_fieldset({
                  name:'tags_checkbox',
                  checkboxes:tags_checks
               })

               tags_selector_elem.replaceChildren(
                  create_div(),
                  tags_checkboxes,
                  create_div()
               )
            }
         }
      }
      catch(error) {
         setTimeout(() => Notification.notify('#tags_placeholder',`Sorry, we were unable to access the Tags. ${error}`,false),1500)
      }
      return tags_selector_elem
   }

   // enable buttons/links displayed in the render
   activate = () => {
 
      //
      // On 'Change' tag checkbox
      // toggle tag (if valid) in 'tags_input' field ( *-delimited str )
      //
      const tags_checkboxes = document.querySelectorAll('.tags_checkbox')
      if(tags_checkboxes) {

         tags_checkboxes.forEach(checkbox => {

            checkbox.addEventListener('change',(event) => {

               // 'tags_input' is the hidden field by which we actually save the tags list to db
               const tags_input = document.getElementById('tags')               
               if(tags_input) {

                  // get current tags list as array
                  const curr_tags = tags_input.value.split('*').filter(e => e)

                  // remove any non-registered tag tokens
                  const verified_curr_tags = curr_tags.filter(curr_tag => {
                     return this.#tags_obj.tags.some(tag => tag.tag === curr_tag)
                  })

                  // toggle presence of selected Tag in current list
                  const existing_tags = new Set(verified_curr_tags) 
                  if(existing_tags.has(event.target.value)) {
                     existing_tags.delete(event.target.value)
                  }
                  else {
                     existing_tags.add(event.target.value)
                  }
                  
                  // sort and save to 'tags_input' field - str w/ '*' delimiter
                  tags_input.value = [...existing_tags].sort().join('*')
               }
            })
         })
      }
   }
}



export default TagsSelector