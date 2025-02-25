import { app } from '../../renderer.js'
import { create_div } from '../../utilities/ui_elements.js'


class TagsLiteList {

   // the key allows us to distinguish btwn multiple TagsLists on same view
   #key

   // parent's callback 
   #actions_callback

   // tags' delimiter
   #delim = '*'

   constructor(key) {
      this.#key = key
   }

   render = async(tags,actions_callback) => {

      if(tags === undefined || tags.length === 0) return

      const tags_array = tags.split(this.#delim)

      this.#actions_callback = actions_callback

      let max_tags_count = 24
      try {
         max_tags_count = await window.app_api.maxTagsCount()
      }
      catch(error) {
         // use initially assigned
      }

      const header = create_div({
         classlist:['flex','space_between','align_items_center','w_full']
      })

      const tags_list_div = create_div({
         attributes:[
            {key:'id',value:this.#key}
         ],
         classlist:['flex','align_items_start','gap_.5','m_0','mt_1','mb_1']
      })
      tags_list_div.append(header)
      let tag_elem
      let tag_text

      if(tags_array) {
         tags_array.forEach(tag => {
            
            tag_elem = create_div({
               attributes:[
                  {key:'id',value:'tags_list_div'}
               ],
               classlist:['align_items_center','tag','border','rounded_0.5','p_0.5','pt_0','pb_0.25']
            })
            tag_text = create_div({
               classlist:[],
               text:tag
            })
            
            tag_elem.append(tag_text)
            tags_list_div.append(tag_elem)
         })
      }

      return tags_list_div
   }

   // enable buttons/links displayed in the render
   activate = () => {

      const open_btn = document.getElementById('open_btn')
      if(open_btn) {
         open_btn.addEventListener('click',() => {
            app.switch_to_component('DeletedRecordsView')
         })
      }

      // delete btns
      let del_tag_btns = document.querySelectorAll('.del_tag_btn')

      if(del_tag_btns) {
         
         del_tag_btns.forEach(del_tag_btn => {
            del_tag_btn.addEventListener('click',(event) => {
               this.#actions_callback('delete',event.target.id)
            })
         })
      }

   }
}



export default TagsLiteList