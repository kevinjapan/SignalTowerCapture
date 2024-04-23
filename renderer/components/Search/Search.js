import App from '../App/App.js'
import SearchForm from '../SearchForm/SearchForm.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import PaginationNav from '../PaginationNav/PaginationNav.js'
import { ui_display_number_as_str,trim_end_char } from '../../utilities/ui_strings.js'
import { create_section,create_h,create_div } from '../../utilities/ui_elements.js'
import { init_card_img_loads } from '../../utilities/ui_utilities.js'




class Search {

   #search_section

   // layout container
   #search_results_container

   // we retain search state (search_term,page,etc) by passing a 'search_context'
   #search_context = {
      key:'Search',
      page:1,
      scroll_y:0
   }

   // props
   #props

   
   #search_term_max_len = 36

   // advanced search is extended
   #show_advanced

   #root_folder

   constructor(props) {
      // returning 'back to list' from Records will return the passed 'search_context'
      if(props) {
         this.#search_context = props.context
      }
      this.#props = props
   }


   render = async () => {

      this.#root_folder = App.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()

      this.#search_section = create_section({
         attributes:[
            {key:'id',value:'search_section'}
         ],
         classlist:['max_w_full']
      })

      let search_status = create_section({
         attributes:[
            {key:'id',value:'search_status'}
         ],
         classlist:['p_0','bg_warning']
      })

      this.#search_results_container = create_div({
         attributes:[
            {key:'id',value:'search_results_container'}
         ],
         classlist:['grid','grid_cards_layout']
      })

      try {
         this.#search_term_max_len = await window.app_api.maxSearchTermLen()
      }
      catch(error) {
         // use initially assigned
      }
      
      this.add_search_form()
    
      this.add_number_results()

      // required for re-instating search_context on 'back' to list actions
      if(this.#search_context) {
         if(this.#search_context.search_term !== undefined)
            this.#search_results_container.append(this.get_items())
      }

      // assemble
      this.#search_section.append(search_status,this.#search_results_container)
      return this.#search_section
   }



   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
   }

   
   //
   // retrieve the paginated search results 
   //
   get_items = async () => {

      if(this.#search_context) {

         try {

            const collection_items_obj = await window.collection_items_api.searchCollectionItems(this.#search_context)

            if (typeof collection_items_obj != "undefined") {
               if(collection_items_obj.outcome === 'success') {

                  // re-assemble
                  this.#search_section.replaceChildren()
                  this.#search_results_container.replaceChildren()
                  
                  this.add_search_form(this.#search_context.search_term)
                  this.add_number_results()
                  
                  let page_count = Math.ceil(collection_items_obj.count / collection_items_obj.per_page)

                  if(collection_items_obj.collection_items && collection_items_obj.collection_items.length > 0) {
                     
                     const top_pagination_nav = new PaginationNav('top',this.go_to_page,page_count,this.#search_context.page)
                     this.#search_section.append(top_pagination_nav.render())
                     top_pagination_nav.activate()

                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = `${ui_display_number_as_str(collection_items_obj.count)} matching records were found.`
                     }
                     
                     let props = {
                        root_folder: this.#root_folder,
                        context:this.#search_context
                     }

                     const collection_item_card = new CollectionItemCard(props)
                     collection_items_obj.collection_items.forEach((item) => {        
                        this.#search_results_container.appendChild(collection_item_card.render(collection_items_obj.collection_item_fields,item))
                     })
         
                     // retain some spacing on short lists
                     this.#search_results_container.style.minHeight = '70vh' 
         
                     this.#search_section.append(this.#search_results_container)
                     setTimeout(() => collection_item_card.activate(),200)

                     const bottom_pagination_nav = new PaginationNav('bottom',this.go_to_page,page_count,this.#search_context.page)  //this.go_to_page,page_count,this.#browse_context.page
                     this.#search_section.append(bottom_pagination_nav.render())
                     bottom_pagination_nav.activate()

                  }
                  else {
                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = 'No matching records were found. '
                     }
                  }

                  // re-instate scroll position if user had scrolled list before opening a record
                  setTimeout(() => window.scroll(0,this.#search_context.scroll_y),100)
               }
               else {
                  let search_status = document.getElementById('search_status')
                  if(search_status) {
                     search_status.innerText = collection_items_obj.message
                  }
               }
            }
            else {
               throw 'No search results were returned.'
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
      else {
         return null
      }
   }

   add_search_form = (search_term) => {
      
      let form_props = {
         search_term:search_term,
         search_term_max_len:this.#search_term_max_len,
         submit_search_term:this.submit_search_term,
         clear_search:this.clear_search
      }
         
      const search_form = new SearchForm(form_props)
      this.#search_section.append(search_form.render())
      setTimeout(() => search_form.activate(),100)
   }

   add_number_results = () => {
      this.#search_section.append(create_div({
         attributes:[
            {key:'id',value:'number_records'}
         ],
         classlist:['p_2']
      }))
   }

   // callback for SearchForm
   submit_search_term = (search_context) => {
      this.#search_context = search_context
      this.#search_context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),200)
   }

   //
   clear_search = () => {
      if(this.#search_results_container) {
         this.#search_results_container.replaceChildren()
      }
      let number_records = document.getElementById('number_records')
      if(number_records) {
         number_records.innerText = ''
      }
   }

   // callback for PageNavigation
   go_to_page = (page) => {
      this.#search_context.page = page
      this.#search_context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),200)
   }



}



export default Search