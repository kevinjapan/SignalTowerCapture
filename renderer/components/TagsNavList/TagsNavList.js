import App from '../App/App.js'
import { create_div } from '../../utilities/ui_elements.js'


// to do : complete adaptation from Search component

class TagsNavList {

   #props

   // parent's callback 
   #actions_callback

   // tags' delimiter
   #delim = '*'

   constructor(props) {
      this.#props = props
   }

   render = async(actions_callback) => {

      const tags_obj = await window.tags_api.getTags()
      if(tags_obj.tags === undefined || tags_obj.tags.length === 0) return null
      const tags = tags_obj.tags

      this.#actions_callback = actions_callback

      let max_tags_count = 24
      try {
         max_tags_count = await window.app_api.maxTagsCount()
      }
      catch(error) {
         // use initially assigned
      }

      const header = create_div({classlist:['flex','space_between','align_items_center','w_full']})

      const tags_list_div = create_div({
         attributes:[{key:'id',value:'tags_list_div'}],
         classlist:['flex','align_items_start','gap_.5','m_0','mt_1','mb_1']
      })
      tags_list_div.append(header)
      let tag_elem
      let tag_text

      if(tags) {
         tags.forEach(tag => {            
            tag_elem = create_div({
               attributes:[
                  {key:'id',value:'tags_list_div'},
                  {key:'data-tag',value:tag.tag}
               ],
               classlist:['align_items_center','tag_nav_link','border','rounded_0.5','p_0.5','pt_0','pb_0.25','cursor_pointer']
            })
            tag_text = create_div({text:tag.tag})            
            tag_elem.append(tag_text)
            tags_list_div.append(tag_elem)
         })
      }
      return tags_list_div
   }

   // enable buttons/links displayed in the render
   activate = () => {

      let tag_nav_links = document.querySelectorAll('.tag_nav_link')
      if(tag_nav_links) {         
         tag_nav_links.forEach(tag_link => {
            tag_link.addEventListener('click',(event) => {
               // this.#actions_callback('delete',event.target.id)
               this.#props.submit_tags_search_term(tag_link.getAttribute('data-tag'))
            })
         })
      }
   }
}



export default TagsNavList