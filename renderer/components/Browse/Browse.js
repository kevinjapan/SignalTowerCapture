import App from '../App/App.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import PaginationNav from '../PaginationNav/PaginationNav.js'
import AlphabetCtrl from '../AlphabetCtrl/AlphabetCtrl.js'
import { ui_display_number_as_str,trim_end_char } from '../../utilities/ui_strings.js'
import { create_section,create_div,create_h } from '../../utilities/ui_elements.js'
import { init_card_img_loads } from '../../utilities/ui_utilities.js'
import Notification from '../../components/Notification/Notification.js'



class Browse {

   #browse_results_container

   // we retain browse state (page,scroll_y,etc) by passing a 'context token'
   // initialising here will display the list on opening this page
   #browse_context = {
      key:'Browse',
      page:1,
      scroll_y:0
   }

   #filter_char = null  // future - just use browse_context directly?

   // props 
   #props = null

   #root_folder

   constructor(props) {

      // 'back' to list from Records will return the passed 'context token'
      if(props) {
         
         this.#browse_context = props.context

         // retain 'filter_char' if 'back' from list item (CollectionItemRecord)
         if(props.context.filters) {
            if(props.context.filters.filter_char) {
               this.#filter_char = props.context.filters.filter_char
            }
         }
      }
      this.#props = props
   }


   render = async () => {

      
      // get root_folder
      const app_config_obj = await window.config_api.getAppConfig()
      if(app_config_obj.outcome === 'success') {
         this.#root_folder = trim_end_char(app_config_obj.app_config.root_folder,'\\')                 
      }

      
      let browse_section = create_section({
         attributes:[
            {key:'id',value:'browse_section'}
         ],
         classlist:['max_w_full']
      })
            
      const browse_heading = create_h({
         level:'h1',
         text:'Browse records',
         classlist:['m_0']
      })
      browse_section.append(browse_heading)

      let number_records = create_div({
         attributes:[
            {key:'id',value:'number_records'}
         ]
      })
      
      this.#browse_results_container = create_div({
         attributes:[
            {key:'id',value:'browse_results_container'}
         ]
      })

      let alphabet_ctrl_props = {
         submit_alpha_filter:this.submit_alpha_filter,
         reset_alpha_filter:this.reset_alpha_filter
      }
      
      const alphabet_ctrl = new AlphabetCtrl(alphabet_ctrl_props)
      browse_section.append(alphabet_ctrl.render())
      setTimeout(() => alphabet_ctrl.activate(),100)
      
      
      // required for re-instating search_context on 'back' to list actions
      if(this.#browse_context) {
         this.#browse_results_container.append(this.get_items())
      }

      // assemble
      browse_section.append(number_records,this.#browse_results_container)
      return browse_section
   }


   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
   }


   //
   // retrieve the paginated items results 
   //
   get_items = async () => {

      if(this.#browse_context) {

         if(this.#filter_char != null) {
            this.#browse_context.filters = {filter_char:`${this.#filter_char}`}
         }
         else {
            this.#browse_context.filters = null
         }

         try {

            const collection_items_obj = await window.collection_items_api.getItems(this.#browse_context)
         

            if (typeof collection_items_obj != "undefined") {
         
               if(collection_items_obj.outcome === 'success') {
                  
                  this.#browse_results_container.replaceChildren()
                  let page_count = Math.ceil(collection_items_obj.count / collection_items_obj.per_page)

                  if(collection_items_obj.collection_items.length > 0) {
                  
                     const top_pagination_nav = new PaginationNav('top',this.go_to_page,page_count,this.#browse_context.page)
                     this.#browse_results_container.append(top_pagination_nav.render())
                     top_pagination_nav.activate()

                     let number_records = document.getElementById('number_records')
                     if(number_records) this.display_number_records(collection_items_obj.count)
            
                     let props = {
                        root_folder: this.#root_folder,
                        context: this.#browse_context
                     }

                     const collection_item_card = new CollectionItemCard(props) 
                     collection_items_obj.collection_items.forEach((item) => {        
                        this.#browse_results_container.appendChild(collection_item_card.render(collection_items_obj.collection_item_fields,item))
                     })
         
                     // retain some spacing on short lists
                     this.#browse_results_container.style.minHeight = '70vh' 
         
                     setTimeout(() => collection_item_card.activate(),200)

                     const bottom_pagination_nav = new PaginationNav('bottom',this.go_to_page,page_count,this.#browse_context.page)
                     this.#browse_results_container.append(bottom_pagination_nav.render())
                     bottom_pagination_nav.activate()
                  }
                  else {
                     this.display_number_records(0)
                  }

                  
                  // re-instate scroll position if user had scrolled list before opening a record
                  setTimeout(() => window.scroll(0,this.#browse_context.scroll_y),50)
               }
               else {
                  throw 'No records were returned.' + collection_items_obj.message
               }
            }
            else {
               throw 'No records were returned.'
            }
         }
         catch(error) {
            let props = {
               msg:'Sorry, we were unable to access the Records.',
               error:error
            }
            App.switch_to_component('Error',props)
         }
      }
   }


   // callback for PageNavigation
   go_to_page = (page) => {
      this.#browse_context.page = page
      this.#browse_context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),50)
   }


   // callbacks for AlphabetCtrl
   submit_alpha_filter = (char) => {
      this.#browse_context.page = 1
      this.#filter_char = char
      this.#browse_context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),500)
   }
   reset_alpha_filter = () => {
      this.#browse_context.page = 1
      this.#filter_char = null
      this.#browse_context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),50)
   }

   display_number_records = (count) => {   
      const intro = count === 1 ? 'is ' : 'are '
      const singular = count === 1 ? '' : 's'
      let text = 
         `There ${intro}${ui_display_number_as_str(count)} record${singular} ${this.#filter_char ? `with title${singular} starting with '` + this.#filter_char + `'`: ''}`
      Notification.notify('#number_records',text,['bg_inform'],false)
   }

}



export default Browse