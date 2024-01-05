import App from '../App/App.js'
import TagsList from '../TagsList/TagsList.js'
import { create_h,create_input,create_div,create_button } from '../../utilities/ui_elements.js'
import { is_valid_tag } from '../../utilities/ui_strings.js'


class TagsConfig {

   // we retain browse state (page,scroll_y,etc) by passing a 'context token'
   #context = {
      key:'Tags',
      filters:{
         record_status:'tags',
         order_by:'tag',
         order_by_direction:'ASC'
      },
      page:1,
      scroll_y:0
   }

   #tags_list_elem

   #tags

   render = async() => {

      const tags_config_component = create_div({
         attributes:[
            {key:'id',value:'tags_config_component'}
         ],
         classlist:['ui_component']
      })
   
      const heading = create_h({
         level:'h3',
         text:'Tags'
      })

      this.#tags_list_elem = create_div({
         attributes:[
            {key:'id',value:'tags_list_elem'}
         ],
         classlist:['m_0']
      }) 
      
      this.#tags = await this.get_tags()

      const tags_list = new TagsList('tags_list')
      if(tags_list) {
         this.#tags_list_elem.append(tags_list.render(this.#tags,this.actions))
         setTimeout(() => tags_list.activate(),100)
      }

      let add_tag_input = create_input({
         attributes:[
            {key:'id',value:'add_tag_input'},
            {key:'name',value:'add_tag_input'},
            {key:'type',value:'text'},
            {key:'value',value:''},
            {key:'maxlength',value:24}
         ],
         classlist:['input_field','m_1']
      })

      let add_tag_btn = create_button({
         attributes:[
            {key:'id',value:'add_tag_btn'}
         ],
         text:'Add Tag'
      })  

      const outcome_div = create_div({
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'outcome_div'}
         ]
      })
      
      // assemble
      tags_config_component.append(heading,this.#tags_list_elem,add_tag_input,add_tag_btn,outcome_div)
      

      return tags_config_component
   }

   
   //
   // retrieve the paginated items results 
   //
   get_tags = async () => {

      try {
         const tags_obj = await window.tags_api.getTags(this.#context)

         if (typeof tags_obj != "undefined") {
         
            if(tags_obj.outcome === 'success') {
               return tags_obj.tags
            }
            else {
               return []
            }
         }
         else {
            return []
         }
      }
      catch(error) {
         let props = {
            msg:'Sorry, we were unable to access the Tags.',
            error:error
         }
         App.switch_to_component('Error',props)
      }
   }


   // enable buttons/links displayed in the render
   activate = async () => {

      const sep = await window.files_api.filePathSep()

      // Add Tag btn
      const add_tag_btn = document.getElementById('add_tag_btn')

      if(add_tag_btn) {

         add_tag_btn.addEventListener('click', async(event) => {
            event.preventDefault()
            let outcome_div = document.getElementById('outcome_div')
            let add_tag_input = document.getElementById('add_tag_input')
            if(add_tag_input) {
               if(is_valid_tag(add_tag_input.value)) {
                  if(this.is_unique_tag(add_tag_input.value)) {
                     this.add_tag(add_tag_input.value)
                     add_tag_input.value = ''
                  }
                  else {
                     if(outcome_div) {
                        outcome_div.innerText = 'This tag already exists, please enter a unique tag.'
                     }
                  }
               }
               else {
                  if(outcome_div) {
                     outcome_div.innerText = 'Please enter a valid tag.'
                  }
               }
            }
         })
      }

      
      // Keydown on add_tag <input> element
      const add_tag_input = document.getElementById('add_tag_input')
      if(add_tag_input) {

         add_tag_input.addEventListener('keydown', async(event) => {
            if(event.key === 'Enter') {
               event.preventDefault()
               let outcome_div = document.getElementById('outcome_div')
               if(is_valid_tag(add_tag_input.value)) {
                  if(this.is_unique_tag(add_tag_input.value)) {
                     this.add_tag(add_tag_input.value)  
                     add_tag_input.value = ''
                  }
                  else {
                     if(outcome_div) {
                        outcome_div.innerText = 'This tag already exists, please enter a unique tag.'
                     }
                  }
               }
               else {
                  if(outcome_div) {
                     outcome_div.innerText = 'Please enter a valid tag.'
                  }
               }      
            }
         })
      }
   }


   //
   // verify tag is unique
   //
   is_unique_tag = (new_tag) => {
      return !this.#tags.some(tag => new_tag === tag.tag)
   }


   //
   // add tag and refresh view
   //
   add_tag = async (tag_name) => {

      const outcome_div = document.getElementById('outcome_div')

      if(is_valid_tag(tag_name)) {

         let new_tag = {
            tag:tag_name
         }
         
         const add_tag_results = await window.tags_api.addTag(new_tag)  

         if (typeof add_tag_results != "undefined") { 

            if(add_tag_results.outcome === 'success') {

               if(outcome_div) {
                  outcome_div.innerText = 
                     `\nThe tag was successfully added.\n\n`
               }

               // update list of tags on this page..
               this.#tags = await this.get_tags()

               const tags_list = new TagsList('tags_list')
               if(tags_list) {
                  this.#tags_list_elem.replaceChildren(tags_list.render(this.#tags,this.actions))
                  setTimeout(() => tags_list.activate(),100)
               }
               
            }
            else {
               if(outcome_div) {
                  outcome_div.innerText = add_tag_results.message
               }
            }
         }
      }
      else {
         if(outcome_div) {
            outcome_div.innerText = 'Please enter a valid tag.'
         }
      }
   }

   actions = async(key,id) => {
      
      switch(key) {
         case 'delete':
            
            const del_tag_results = await window.tags_api.deleteTag(id)  

            if (typeof del_tag_results != "undefined") { 

               if(del_tag_results.outcome === 'success') {
      
                  // to do : wrap in a lib func and rollout all components using 'outcome' messaging
                  //         w/ option to fade out after certain time.
                  if(outcome_div) {
                     outcome_div.innerText = 
                        `\nThe tag was successfully deleted.\n\n`
                  }
      
                  // update list of tags on this page..
                  this.#tags = await this.get_tags()
      
                  const tags_list = new TagsList('tags_list')
                  if(tags_list) {
                     this.#tags_list_elem.replaceChildren(tags_list.render(this.#tags,this.actions))
                     setTimeout(() => tags_list.activate(),100)
                  }
                  
               }
               else {
                  if(outcome_div) {
                     outcome_div.innerText = del_tag_results.message
                  }
               }
            }
            break
         default:
            console.log('actions key was not recognized')
      }
      
   }

}



export default TagsConfig