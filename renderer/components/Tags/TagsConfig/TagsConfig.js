import { app } from '../../../renderer.js'
import PageBanner from '../../PageBanner/PageBanner.js'
import TagsList from '../TagsList/TagsList.js'
import Notification from '../../../components/Notification/Notification.js'
import { create_section,create_input,create_div,create_button } from '../../../utilities/ui_elements.js'
import { is_valid_tag } from '../../../utilities/ui_strings.js'

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
         attributes:[{key:'id',value:'tags_section'}]
      })

      const page_banner = new PageBanner({
         icon_name:'tag',
         title:'Configure Tags',
         lead:`You can 'tag' records with keywords or categories, and then upon searching for a 
               given tag, all the matching 'tagged' records will be found.
               This can be useful for grouping records which are physically
               separate in your Collections folder. For example, the tag
               'education' might pertain to individual files across multiple folders.`
      })

      this.#tags_list_elem = create_div({
         attributes:[{key:'id',value:'tags_list_elem'}],
         classlist:['m_0','mx_2']
      }) 
      
      this.#tags = await this.get_tags()

      const tags_list = new TagsList('tags_list')
      if(tags_list) {
         this.#tags_list_elem.append(await tags_list.render(this.#tags,this.actions))
         setTimeout(() => tags_list.activate(),100)
      }
    
      const input_section = create_div({
         classlist:['fit_content','mx_auto','bg_white','rounded','mb_1','p_1','pr_1']
      })
      const add_tag_input = create_input({
         attributes:[
            {key:'id',value:'add_tag_input'},
            {key:'name',value:'add_tag_input'},
            {key:'type',value:'text'},
            {key:'value',value:''},
            {key:'maxlength',value:24}
         ],
         classlist:['input_field','m_1','mx_2']
      })
      const add_tag_btn = create_button({
         attributes:[{key:'id',value:'add_tag_btn'}],
         text:'Add Tag'
      })  
      input_section.append(add_tag_input,add_tag_btn)

      const notifications = create_div({attributes:[{key:'id',value:'notifications'}]})

      window.scroll(0,0)

      // assemble
      tags_section.append(
         page_banner.render(),
         this.#tags_list_elem,
         input_section,
         notifications
      )

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
         app.switch_to_component('Error',props,false)
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
                     Notification.notify('#notifications',`This tag already exists, please enter a unique tag.`)
                  }
               }
               else {
                  Notification.notify('#notifications',`Please enter a valid tag.`)
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
                     Notification.notify('#notifications',`This tag already exists, please enter a unique tag.`)
                  }
               }
               else {
                  Notification.notify('#notifications',`Please enter a valid tag.`)
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

               Notification.notify('#notifications',`The tag was successfully added.`,['bg_inform'])

               // update list of tags on this page..
               this.#tags = await this.get_tags()

               const tags_list = new TagsList('tags_list')
               if(tags_list) {
                  this.#tags_list_elem.replaceChildren(await tags_list.render(this.#tags,this.actions))
                  setTimeout(() => tags_list.activate(),100)
               }
               
            }
            else {
               Notification.notify('#notifications',add_tag_results.message)
            }
         }
      }
      else {
         Notification.notify('#notifications','Please enter a valid tag.')
      }
   }

   actions = async(key,id,tag) => {
      
      switch(key) {
         
         case 'delete':
            
            const del_tag_results = await window.tags_api.deleteTag(id)  

            if (typeof del_tag_results != "undefined") { 

               if(del_tag_results.outcome === 'success') {
      
                  Notification.notify('#notifications',`The tag '${tag}' was successfully deleted`,['bg_inform'],false)
      
                  // update list of tags on this page..
                  this.#tags = await this.get_tags()
      
                  const tags_list = new TagsList('tags_list')
                  if(tags_list) {
                     this.#tags_list_elem.replaceChildren(await tags_list.render(this.#tags,this.actions))
                     setTimeout(() => tags_list.activate(),100)
                  }
                  
               }
               else {
                  Notification.notify('#notifications',del_tag_results.message)
               }
            }
            break
         default:
            Notification.notify('#notifications','The action was not recognized.')
      }
      
   }

   
   get_default_context = () => {
      return this.#context
   }
}



export default TagsConfig