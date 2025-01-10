import { create_div } from '../../../utilities/ui_elements.js'


// Tags Nav

class TagsNavList {

   #props

   constructor(props) {
      this.#props = props
   }

   render = async() => {

      const tags_obj = await window.tags_api.getTags()
      if(tags_obj.tags === undefined || tags_obj.tags.length === 0) return null
      const tags = tags_obj.tags

      const header = create_div({
         classlist:['flex','space_between','align_items_center','w_full']
      })
      const tags_list_div = create_div({
         attributes:[{key:'id',value:'tags_list_div'}],
         classlist:['flex','align_items_start','gap_.5','m_0','mb_1','mx_2']
      })
      tags_list_div.append(header)

      let tag_elem

      if(tags) {
         tags.forEach(tag => {            
            tag_elem = create_div({
               attributes:[
                  {key:'id',value:`tag_${tag.tag}`},
                  {key:'data-tag',value:tag.tag}
               ],
               classlist:['tag_nav_link','align_items_center','border','rounded_0.5','p_0.5','pt_0','pb_0.25','cursor_pointer','bg_white'],
               text:tag.tag
            })
            tags_list_div.append(tag_elem)
         })
      }
      return tags_list_div
   }

   // enable buttons/links displayed in the render
   activate = () => {

      // click on a Tag link
      let tag_nav_links = document.querySelectorAll('.tag_nav_link')
      if(tag_nav_links) {         
         tag_nav_links.forEach(tag_link => {
            tag_link.addEventListener('click',(event) => {

               // deselect all
               let links = document.querySelectorAll('.tag_nav_link')
               if(links) {         
                  links.forEach(link => {
                     link.classList.remove('bg_positive')
                  })
               }
               // selected
               const selected_link = document.getElementById(event.target.getAttribute('id'))
               if(selected_link) selected_link.classList.add('bg_positive')

               // submit
               this.#props.submit_tag(tag_link.getAttribute('data-tag'))
            })
         })
      }
   }

   highlight_selected = (selected_tag) => {
      // sm delay to allow elements to render
      setTimeout(() => {
         const tag = document.getElementById(`tag_${selected_tag}`)
         if(tag) tag.classList.add('bg_positive')
      },100)
   }
}



export default TagsNavList