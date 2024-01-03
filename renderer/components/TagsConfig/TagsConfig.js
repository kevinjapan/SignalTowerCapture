import App from '../App/App.js'
import TagsList from '../TagsList/TagsList.js'
import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_h,create_input,create_div,create_button } from '../../utilities/ui_elements.js'



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
      
      let tags = await this.get_tags()

      const tags_list = new TagsList('tags_list')
      if(tags_list) {
         this.#tags_list_elem.append(tags_list.render(tags))
         tags_list.activate()
      }

      // to do : max_len for tag ?
  
      let add_tag_input = create_input({
         attributes:[
            {key:'id',value:'add_tag_input'},
            {key:'name',value:'add_tag_input'},
            {key:'type',value:'text'},
            {key:'value',value:''},
            {key:'maxlength',value:50}
         ],
         classlist:['input_field','m_1']
      })

      let add_tag_btn = create_button({
         attributes:[
            {key:'id',value:'add_tag_btn'}
         ],
         text:'Add Tag'
      })  

      const action_outcome = create_div({
         attributes:[
            {key:'id',value:'action_outcome'}
         ],
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1']
      })

      // to do : rename 'borrowed' code/vars from export etc.

      const outcome_div = create_div({
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'outcome_div'}
         ]
      })
      
      // assemble
      tags_config_component.append(heading,this.#tags_list_elem,add_tag_input,add_tag_btn,action_outcome,outcome_div)
      

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
            let add_tag_input = document.getElementById('add_tag_input')
            if(add_tag_input) {         
               this.add_tag(add_tag_input.value)               
            }
         })
      }

      
      // Keydown on add_tag <input> element
      const add_tag_input = document.getElementById('add_tag_input')
      if(add_tag_input) {

         add_tag_input.addEventListener('keydown', async(event) => {
            if(event.key === 'Enter') {
               event.preventDefault()
               this.add_tag(add_tag_input.value)               
            }
         })
      }


   }

   
   add_tag = async (tag_name) => {

      const outcome_div = document.getElementById('outcome_div')

      // to do : validate 'tag_name'

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
            let tags = await this.get_tags()

            const tags_list = new TagsList('tags_list')
            if(tags_list) {
               this.#tags_list_elem.replaceChildren(tags_list.render(tags))
               tags_list.activate()
            }
            
         }
         else {
            if(outcome_div) {
               outcome_div.innerText = add_tag_results.message
            }
         }
      }
   }

}



export default TagsConfig