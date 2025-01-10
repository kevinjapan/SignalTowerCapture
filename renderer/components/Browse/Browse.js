import { app } from '../../renderer.js'
import PageBanner from '../PageBanner/PageBanner.js'
import CardGrid from '../CardGrid/CardGrid.js'
import CollectionItemCard from '../CollectionItems/CollectionItemCard/CollectionItemCard.js'
import PaginationNav from '../PaginationNav/PaginationNav.js'
import AlphabetCtrl from '../AlphabetCtrl/AlphabetCtrl.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import { ui_display_number_as_str } from '../../utilities/ui_strings.js'
import { create_section,create_div } from '../../utilities/ui_elements.js'
import { no_root_elem, init_card_img_loads } from '../../utilities/ui_utilities.js'


// to do : move top -level nav components into Views or Pages folder - mark as top-level


class Browse {

   #props

   // Component container element
   #browse_section

   // alphabet navigation
   #alpha_ctrl

   // pagination
   #pagination_nav
   
   // CardGrid object
   #card_grid_obj

   // Cards grid container element
   #browse_results_container

   // CollectionItems list
   #items

   // Page Context (State)
   #context = {
      key:'Browse',
      page:1,
      scroll_y:0
   }

   #filter_char = null

   #root_folder

   constructor(props) {
      // 'back' to list from Records will return the passed 'context token'
      if(props && props.context) {
         this.#context = props.context
         // retain 'filter_char' if 'back' from list item (CollectionItemRecord)
         if(props.context.filters) {
            if(props.context.filters.filter_char) this.#filter_char = props.context.filters.filter_char
         }
         this.#props = props
      }
   }

   render = () => {

      this.#root_folder = app.get_root_folder()
      if(this.#root_folder === '') return no_root_elem()

      // Container Section
      this.#browse_section = create_section({
         attributes:[{key:'id',value:'browse_section'}],
         classlist:['max_w_full']
      })

      // PageBanner
      const page_banner = new PageBanner({
         icon_name:'card_text',
         title:'Browse',
         lead:'Browse all the Records.'
      })
   
      // Pagination
      // to do : remove & replace w/ better pagination ctrls below
      this.#alpha_ctrl = new AlphabetCtrl({
         selected_char:this.#filter_char ? this.#filter_char : null,
         submit_alpha_filter:this.submit_alpha_filter,
         reset_alpha_filter:this.reset_alpha_filter
      })
      setTimeout(() => this.#alpha_ctrl.activate(),50)
      
      // Display no. records found
      const num_records = create_div({
         attributes:[{key:'id',value:'number_records'}],
         classlist:['p_.5','pt_1','text_center']
      })
      
      // Pagination
      this.#pagination_nav = new PaginationNav()

      // Card Grid
      this.#card_grid_obj = new CardGrid({
         container_id:'browse_results_container',
         refresh:this.refresh,
         get_item:this.get_item
      })
      this.#browse_results_container = this.#card_grid_obj.render('loading..')

      // required for re-instating search_context on 'back' to list actions
      if(this.#context) this.get_items()
         
      window.scroll(0,0)

      // assemble
      this.#browse_section.append(
         page_banner.render(),
         this.#alpha_ctrl.render(),
         num_records,
         this.#pagination_nav.render(),
         this.#browse_results_container,
         this.#pagination_nav.render()
      )

      return this.#browse_section
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
      if(this.#card_grid_obj) this.#card_grid_obj.activate()
      if(this.#pagination_nav) this.#pagination_nav.activate() 
   }

   // retrieve the paginated items results 
   get_items = async () => {

      if(this.#context) {
         if(this.#filter_char != null) {
            this.#context.filters = {filter_char:`${this.#filter_char}`}
         }
         else {
            this.#context.filters = null
         }

         try {
            const collection_items_obj = await window.collection_items_api.getItems(this.#context)


            const { outcome,count,per_page,collection_items,collection_item_fields } = collection_items_obj
         
            if(typeof collection_items_obj != "undefined" && outcome === 'success') {
               if(await is_valid_response_obj('read_collection_items',collection_items_obj)) {

                  this.#items = collection_items_obj.collection_items

                  this.#browse_results_container.replaceChildren()

                  let page_count = Math.ceil(count / per_page)

                  if(collection_items.length > 0) {

                     let number_records = document.getElementById('number_records')
                     if(number_records) {
                        number_records.innerText = `${ui_display_number_as_str(count)} matching record${count === 1 ? '' : 's'} ${count === 1 ? 'was found' : 'were found'}.`
                     }

                     if(Array.isArray(collection_items)) {
                        let index = 0
                        for(const item of collection_items) {
                           const collection_item_card = new CollectionItemCard({
                              root_folder:this.#root_folder,
                              card_index:index++
                           })
                           this.#browse_results_container.append(collection_item_card.render(collection_item_fields,item))
                        }
                     }

                     const page_navs = document.querySelectorAll('.page_nav')
                     if(page_navs) {
                        page_navs.forEach(page_nav => {
                           page_nav.replaceWith(this.#pagination_nav.render({
                              key:'top',
                              callback:this.go_to_page,
                              page_count:page_count,
                              current_page:this.#context.page
                           }))
                        })
                     }
                  }
                  else {                     
                     let number_records = document.getElementById('number_records')
                     if(number_records) number_records.innerText = 'No matching records were found.'
                  }
                  // re-instate scroll position if user had scrolled list before opening a record
                  setTimeout(() => window.scroll(0,this.#context.scroll_y),50)
               }
               else {
                  app.switch_to_component('Error',{
                     msg:'Sorry, we were unable to process an invalid response from the main process in Browse.'
                  },false)
               }
            }
            else {
               throw 'No records were returned.'
            }
         }
         catch(error) {
            app.switch_to_component('Error',{
               msg:'Sorry, we were unable to access the Records.',
               error:error
            },false)
         }
      }
   }

   // callback for PageNavigation
   go_to_page = (page) => {
      if(this.#context) {
         this.#context.page = page
         this.#context.scroll_y = 0
         this.get_items()
         setTimeout(() => this.activate(),100)
      }
   }

   // callbacks for AlphabetCtrl
   submit_alpha_filter = (char) => {
      if(this.#context) {
         this.#context.page = 1
         this.#filter_char = char
         this.#context.scroll_y = 0
         this.get_items()
         setTimeout(() => this.activate(),100)
      }
   }
   reset_alpha_filter = () => {
      if(this.#context) {
         this.#context.page = 1
         this.#filter_char = null
         this.#context.scroll_y = 0
         this.get_items()
         setTimeout(() => this.activate(),100)
      }
   }

   // grid can request refresh
   refresh = () => {
      this.#context.scroll_y = window.scrollY
      this.get_items()
      setTimeout(() => this.activate(),100)
   }

   // future : rollout all 'page_component' components
   // opportunity here to make 'page_component' base class + other? -
   // - 1. page_component - locks into history, so 'get_default_context'
   // - 2. card_grid_container component - provide 'get_item' and this.#items list

   get_item = (id) => {
      return this.#items.find(item => {
         return item.id === parseInt(id)
      })
   }

   get_default_context = () => {
      return this.#context
   }
}


export default Browse