import { app } from '../../renderer.js'
import TagsList from '../TagsList/TagsList.js'
import Notification from '../../components/Notification/Notification.js'
import { icon } from '../../utilities/ui_utilities.js'
import { create_section,create_input,create_h,create_p,create_div,create_button } from '../../utilities/ui_elements.js'
import { is_valid_tag } from '../../utilities/ui_strings.js'

class TagsConfig {

   // we retain browse state (page,scroll_y,etc) by passing a 'context token'
   #context = {
      key:'TagsConfig',
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

      
      let tags_section = create_section({
         attributes:[
            {key:'id',value:'tags_section'}
         ],
         classlist:['fade_in','bg_white','box_shadow','rounded','m_2','mb_2','pb_2']
      })
      const tags_header = create_div({
         classlist:['flex','align_items_center']
      })
      const tags_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'Tags'
      })
      tags_header.append(icon('tag'),tags_section_h)
      const tags_section_desc = create_p({
         classlist:['mt_0','mb_0','pt_0','pb_0'],
         text:`You can 'tag' records with keywords or categories, and then upon searching for a 
         given tag, all the matching 'tagged' records will be found.
         This can be useful for grouping records which are physically
         separate in your Collections folder. For example, the tag
         'education' might pertain to individual files across multiple folders.`

      })
      tags_section.append(tags_header,tags_section_desc)


   
      this.#tags_list_elem = create_div({
         attributes:[
            {key:'id',value:'tags_list_elem'}
         ],
         classlist:['m_0']
      }) 
      
      this.#tags = await this.get_tags()

      const tags_list = new TagsList('tags_list')
      if(tags_list) {
         this.#tags_list_elem.append(await tags_list.render(this.#tags,this.actions))
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
         attributes:[
            {key:'id',value:'outcome_div'}
         ]
      })
      
      // assemble
      tags_section.append(this.#tags_list_elem,add_tag_input,add_tag_btn,outcome_div)

      return tags_section
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
         app.switch_to_component('Error',props)
      }
   }


   // enable buttons/links displayed in the render
   activate = async () => {


      // clicked Add Tag btn

      const add_tag_btn = document.getElementById('add_tag_btn')

      if(add_tag_btn) {

         add_tag_btn.addEventListener('click', async(event) => {

            event.preventDefault()
            
            let add_tag_input = document.getElementById('add_tag_input')
            if(add_tag_input) {

               if(is_valid_tag(add_tag_input.value)) {

                  if(this.is_unique_tag(add_tag_input.value)) {
                     this.add_tag(add_tag_input.value)
                     add_tag_input.value = ''
                  }
                  else {
                     Notification.notify('#outcome_div',`This tag already exists, please enter a unique tag.`)
                  }
               }
               else {
                  Notification.notify('#outcome_div',`Please enter a valid tag.`)
               }
            }
         })
      }

      
      // Keydown on Add Tag <input> element
      const add_tag_input = document.getElementById('add_tag_input')

      if(add_tag_input) {

         add_tag_input.addEventListener('keydown', async(event) => {

            if(event.key === 'Enter') {

               event.preventDefault()
               
               if(is_valid_tag(add_tag_input.value)) {
                  if(this.is_unique_tag(add_tag_input.value)) {
                     this.add_tag(add_tag_input.value)  
                     add_tag_input.value = ''
                  }
                  else {
                     Notification.notify('#outcome_div',`This tag already exists, please enter a unique tag.`)
                  }
               }
               else {
                  Notification.notify('#outcome_div',`Please enter a valid tag.`)
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

      if(is_valid_tag(tag_name)) {

         let new_tag = {
            tag:tag_name
         }
         
         const add_tag_results = await window.tags_api.addTag(new_tag)  

         if (typeof add_tag_results != "undefined") { 

            if(add_tag_results.outcome === 'success') {

               Notification.notify('#outcome_div',`The tag was successfully added.`,['bg_inform'])

               // update list of tags on this page..
               this.#tags = await this.get_tags()

               const tags_list = new TagsList('tags_list')
               if(tags_list) {
                  this.#tags_list_elem.replaceChildren(await tags_list.render(this.#tags,this.actions))
                  setTimeout(() => tags_list.activate(),100)
               }
               
            }
            else {
               Notification.notify('#outcome_div',add_tag_results.message)
            }
         }
      }
      else {
         Notification.notify('#outcome_div','Please enter a valid tag.')
      }
   }

   actions = async(key,id) => {
      
      switch(key) {
         case 'delete':
            
            const del_tag_results = await window.tags_api.deleteTag(id)  

            if (typeof del_tag_results != "undefined") { 

               if(del_tag_results.outcome === 'success') {
      
                  Notification.notify('#outcome_div','The tag was successfully deleted',['bg_inform'])
      
                  // update list of tags on this page..
                  this.#tags = await this.get_tags()
      
                  const tags_list = new TagsList('tags_list')
                  if(tags_list) {
                     this.#tags_list_elem.replaceChildren(await tags_list.render(this.#tags,this.actions))
                     setTimeout(() => tags_list.activate(),100)
                  }
                  
               }
               else {
                  Notification.notify('#outcome_div',del_tag_results.message)
               }
            }
            break
         default:
            Notification.notify('#outcome_div','The action was not recognized.')
      }
      
   }

   
   get_default_context = () => {
      return this.#context
   }
}



export default TagsConfig