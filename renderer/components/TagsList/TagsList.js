import App from '../App/App.js'
import { DESC } from '../../utilities/ui_descriptions.js'
import { 
   create_div,
   create_h,
   create_p,
   create_button
} from '../../utilities/ui_elements.js'


class TagsList {

   // the key allows us to distinguish btwn multiple TagsLists on same view
   #key

   constructor(key) {
      this.#key = key
   }

   render = (tags) => {

      const tags_list_div = create_div({
         attributes:[
            {key:'id',value:this.#key}
         ],
         classlist:['flex','gap_.5','m_0','mt_1','mb_1']
      })

      tags.forEach((tag) => {
         
         const tag_elem = create_div({
            attributes:[
               {key:'id',value:'tags_list_div'}
            ],
            classlist:['tag','border','rounded','pl_0.5','pr_0.5','pb_.25'],
            text:tag.tag
         })
         tags_list_div.append(tag_elem)
      })

      return tags_list_div
   }

   // enable buttons/links displayed in the render
   activate = () => {

      const open_btn = document.getElementById('open_btn')
      if(open_btn) {
         open_btn.addEventListener('click',() => {

            // to do : this?
            App.switch_to_component('DeletedRecords')

         })
      }

   }
}



export default TagsList