import App from '../App/App.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import PaginationNav from '../PaginationNav/PaginationNav.js'
import AlphabetCtrl from '../AlphabetCtrl/AlphabetCtrl.js'
import Notification from '../../components/Notification/Notification.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import { ui_display_number_as_str } from '../../utilities/ui_strings.js'
import { create_section,create_div } from '../../utilities/ui_elements.js'
import { init_card_img_loads,no_root_folder } from '../../utilities/ui_utilities.js'



class Browse {

   #browse

   #alphabet_ctrl

   #browse_section

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

      this.#root_folder = App.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()

      this.#browse = create_section({
         attributes:[{key:'id',value:'browse'}],
         classlist:['fade_in','max_w_full']
      })

      this.#browse_section = create_section({
         attributes:[{key:'id',value:'browse_section'}],
         classlist:['max_w_full']
      })

      let alphabet_ctrl_props = {
         selected_char:null,
         submit_alpha_filter:this.submit_alpha_filter,
         reset_alpha_filter:this.reset_alpha_filter
      }      
      this.#alphabet_ctrl = new AlphabetCtrl(alphabet_ctrl_props)
      setTimeout(() => this.#alphabet_ctrl.activate(),100)
      this.#browse.append(this.#alphabet_ctrl.render())

      this.add_number_results()
      
      this.#browse_results_container = create_div({
         attributes:[{key:'id',value:'browse_results_container'}],
         classlist:['grid','grid_cards_layout']
      })

      // required for re-instating search_context on 'back' to list actions
      if(this.#browse_context) this.get_items()

      this.#browse.append(this.#browse_section)
      return this.#browse
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
   }


   // retrieve the paginated items results 
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
         
            if (typeof collection_items_obj != "undefined" && collection_items_obj.outcome === 'success') {
               if(await is_valid_response_obj('read_collection_items',collection_items_obj)) {

                  // re-assemble
                  this.#browse_section.replaceChildren()
                  this.#browse_results_container.replaceChildren()

                  this.add_number_results()
                  let page_count = Math.ceil(collection_items_obj.count / collection_items_obj.per_page)

                  if(collection_items_obj.collection_items.length > 0) {                  
                     const top_pagination_nav = new PaginationNav('top',this.go_to_page,page_count,this.#browse_context.page)
                     this.#browse_section.append(top_pagination_nav.render())
                     top_pagination_nav.activate()

                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = `${ui_display_number_as_str(collection_items_obj.count)} matching records were found.`
                     }
            
                     let props = {
                        root_folder: this.#root_folder,
                        context: this.#browse_context
                     }
                     const collection_item_card = new CollectionItemCard(props) 
                     if(Array.isArray(collection_items_obj.collection_items)) {
                        collection_items_obj.collection_items.forEach((item) => {        
                           this.#browse_results_container.appendChild(collection_item_card.render(collection_items_obj.collection_item_fields,item))
                        })
                     }
         
                     // retain some spacing on short lists
                     this.#browse_results_container.style.minHeight = '70vh' 
         
                     setTimeout(() => collection_item_card.activate(),200)

                     this.#browse_section.append(this.#browse_results_container)

                     const bottom_pagination_nav = new PaginationNav('bottom',this.go_to_page,page_count,this.#browse_context.page)
                     this.#browse_section.append(bottom_pagination_nav.render())
                     bottom_pagination_nav.activate()
                  }
                  else {
                        this.#browse_section.append(create_div({
                           attributes:[{key:'id',value:'browse_outcome'}]
                        }))
                        Notification.notify('#browse_outcome','There are no records in the system.',['bg_inform'])
                     
                     let number_records = document.getElementById('number_records')
                     if(number_records) number_records.innerText = ``
                  }
                  // re-instate scroll position if user had scrolled list before opening a record
                  setTimeout(() => window.scroll(0,this.#browse_context.scroll_y),50)
               }
               else {
                  App.switch_to_component('Error',{
                     msg:'Sorry, we were unable to process an invalid response from the main process in Browse.'
                  })
               }
            }
            else {
               throw 'No records were returned.'
            }
         }
         catch(error) {
            App.switch_to_component('Error',{
               msg:'Sorry, we were unable to access the Records.',
               error:error
            })
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
      setTimeout(() => this.activate(),50)
   }
   reset_alpha_filter = () => {
      this.#browse_context.page = 1
      this.#filter_char = null
      this.#browse_context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),50)
   }

   add_number_results = () => {
      this.#browse_section.append(create_div({
         attributes:[{key:'id',value:'number_records'}],
         classlist:['p_.5','pt_1','text_center']
      }))      
   }
}



export default Browse