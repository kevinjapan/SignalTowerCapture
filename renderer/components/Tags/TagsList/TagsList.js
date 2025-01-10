import { app } from '../../../renderer.js'
import { create_div,create_h,create_button } from '../../../utilities/ui_elements.js'


class TagsList {

   // the key allows us to distinguish btwn multiple TagsLists on same view
   #key

   // parent's callback 
   #actions_callback

   constructor(key) {
      this.#key = key
   }

   render = async(tags,actions_callback) => {

      if(typeof tags === 'undefined') return 'TagsList received no tags to display.'
      
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
      const heading = create_h({
         level:'h4',
         text:'Tags',
         classlist:['inline_block','m_0']
      })
      const count = create_div({
         classlist:['text_grey','pt_0.5','pb_0.5'],
         text:`(${tags.length}/${max_tags_count})`
      })

      const tags_list_div = create_div({
         attributes:[{key:'id',value:this.#key}],
         classlist:['flex','gap_.5','m_0','mt_0.5','mb_1','mx_2']
      })
      header.append(heading,count)
      tags_list_div.append(header)
      let tag_elem
      let tag_text
      let del_elem

      if(tags) {
         if(Array.isArray(tags)) {
            tags.forEach(tag => {
               
               tag_elem = create_div({
                  attributes:[{key:'id',value:'tags_list_div'}],
                  classlist:['flex','gap_1','justify_center','align_items_center','tag','border','rounded','bg_white','pl_1','pb_0.25']
               })
               tag_text = create_div({
                  classlist:['align_self_center'],
                  text:tag.tag
               })
               del_elem = create_button({
                  attributes:[
                     {key:'id',value:tag.id},
                     {key:'data-tag',value:tag.tag}
                  ],
                  classlist:['del_tag_btn','bg_white','text_grey','no_border','mt_0.75','mr_0.5','p_0','pb_0.25','pl_0.5','pr_0.5','pt_0'],
                  text:'x'
               })
               
               tag_elem.append(tag_text,del_elem)
               tags_list_div.append(tag_elem)
            })
         }
      }

      return tags_list_div
   }

   // enable buttons/links displayed in the render
   activate = () => {

      const open_btn = document.getElementById('open_btn')
      if(open_btn) {
         open_btn.addEventListener('click',() => {
            app.switch_to_component('DeletedRecords')
         })
      }

      // delete btns
      let del_tag_btns = document.querySelectorAll('.del_tag_btn')

      if(del_tag_btns) {
         
         del_tag_btns.forEach(del_tag_btn => {
            del_tag_btn.addEventListener('click',(event) => {

               const tag = event.target.getAttribute('data-tag')
               this.#actions_callback('delete',event.target.id,tag)
            })
         })
      }

   }
}



export default TagsList