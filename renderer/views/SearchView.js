import { app } from '../renderer.js'
import PageBanner from '../components/PageBanner/PageBanner.js'
import SearchForm from '../components/Search/SearchForm/SearchForm.js'
import CardGrid from '../components/CardGrid/CardGrid.js'
import CollectionItemCard from '../components/CollectionItems/CollectionItemCard/CollectionItemCard.js'
import PaginationNav from '../components/PaginationNav/PaginationNav.js'
import Notification from '../components/Notification/Notification.js'
import { ui_display_number_as_str } from '../utilities/ui_strings.js'
import { create_section,create_div } from '../utilities/ui_elements.js'
import { init_card_img_loads,no_root_folder, no_root_elem } from '../utilities/ui_utilities.js'



class SearchView {

   #props

   // Component container element
   #search_section

   // pagination
   #pagination_nav

   // CardGrid object
   #card_grid_obj

   // Cards grid container element
   #search_results_container

   // CollectionItems list
   #items

   // Page Context (State)
   #context = {
      key:'Search',
      search_term:'',
      page:1,
      scroll_y:0
   }

   #show_advanced

   #root_folder


   constructor(props) {
      // returning 'back to list' from Records will return the passed 'search_context'
      if(props) {
         this.#context = props.context
      }
      this.#props = props
   }

   render = async () => {


      this.#root_folder = app.get_root_folder()
      if(this.#root_folder === '') return no_root_elem()

      this.#search_section = create_section({
         attributes:[{key:'id',value:'search_section'}]
      })
  
      const page_banner = new PageBanner({
         icon_name:'search',
         title:'Search',
         lead:'Search all the Records.'
      })

      const search_form = new SearchForm({
         search_term:'',
         search_term_max_len:app.max_search_term_len(),
         submit_search_term:this.submit_search_term,
         clear_search:this.clear_search
      })
      setTimeout(() => search_form.activate(),100)
      
      const num_records = create_div({
         attributes:[{key:'id',value:'number_records'}],
         classlist:['p_.5','pt_1','text_center']
      })

      this.#pagination_nav = new PaginationNav()

      let search_status = create_section({
         attributes:[{key:'id',value:'search_status'}],
         classlist:['p_0','bg_warning']
      })

      // grid wrapper
      this.#card_grid_obj = new CardGrid({
         container_id:'search_results_container',
         refresh:this.refresh,
         get_item:this.get_item
      })
      this.#search_results_container = this.#card_grid_obj.render()

      // required for re-instating search_context on 'back' to list actions
      if(this.#context) {
         if(this.#context.search_term !== undefined && this.#context.search_term !== '')
            this.#search_results_container.append(this.get_items())
      }
      window.scroll(0,0)
      
      // assemble
      this.#search_section.append(
         page_banner.render(),
         search_form.render(),
         num_records,
         this.#pagination_nav.render(),
         search_status,
         this.#search_results_container,
         this.#pagination_nav.render()
      )
      return this.#search_section
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
      if(this.#card_grid_obj) this.#card_grid_obj.activate()
      if(this.#pagination_nav) this.#pagination_nav.activate() 
   }

   // retrieve the paginated search results 
   get_items = async () => {

      if(this.#context) {
         try {
            const collection_items_obj = await window.collection_items_api.searchCollectionItems(this.#context)

            if (typeof collection_items_obj != "undefined") {
               if(collection_items_obj.outcome === 'success') {

                  this.#items = collection_items_obj.collection_items

                  let { count,per_page,collection_item_fields,collection_items } = collection_items_obj

                  this.#search_results_container.replaceChildren()
                                   
                  let page_count = Math.ceil(count / per_page)

                  if(collection_items && collection_items.length > 0) {                     

                     let number_records = document.getElementById('number_records')
                     if(number_records) number_records.innerText = `${ui_display_number_as_str(count)} matching records were found.`
                     
                     let props = {
                        root_folder: this.#root_folder,
                        context:this.#context
                     }
                     const collection_item_card = new CollectionItemCard(props)

                     if(Array.isArray(collection_items)) {
                        for(const item of collection_items) {         
                           this.#search_results_container.appendChild(collection_item_card.render(collection_item_fields,item))
                        }
                     }
         
                     // retain spacing on short lists
                     this.#search_results_container.style.minHeight = '70vh'         
    
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
                     if(number_records) number_records.innerText = 'No matching records were found. '
                     this.#pagination_nav.clear()
                  }
                  // re-instate scroll position if user had scrolled list before opening a record
                  setTimeout(() => window.scroll(0,this.#context.scroll_y),50)
               }
               else {
                  Notification.notify('#search_status',collection_items_obj.message)
               }
            }
            else {
               throw 'No search results were returned.'
            }
         }
         catch(error) {
            app.switch_to_component('Error',{
               msg:'Sorry, we were unable to access the Records.',
               error:error
            },false)
         }
      }
      else {
         return null
      }
   }

   // callback for SearchForm
   submit_search_term = (search_context) => {
      this.add_to_history(search_context)
      this.#context = search_context
      this.#context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),200)
   }

   // Add current search to History - we simply add a Search page w/ new context
   // this gets 'search_term' into History chain
   add_to_history = (context) => {
      const history = app.get_service('history')
      if(history) history.add_visited_page('search',context)
   }

   // callback for PageNavigation
   go_to_page = (page) => {
      this.#context.page = page
      this.#context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),200)
   }

   clear_search = () => {
      if(this.#search_results_container) this.#search_results_container.replaceChildren()
      let number_records = document.getElementById('number_records')
      if(number_records) number_records.innerText = ''
   }
   
   // grid can request refresh
   refresh = () => {
      this.#context.scroll_y = window.scrollY
      this.get_items()
      setTimeout(() => this.activate(),100)
   }

   get_item = (id) => {
      return this.#items.find(item => {
         return item.id === parseInt(id)
      })
   }

   get_default_context = () => {
      return this.#context
   }
}


export default SearchView