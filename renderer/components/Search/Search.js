import App from '../App/App.js'
import SearchForm from '../SearchForm/SearchForm.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import PaginationNav from '../PaginationNav/PaginationNav.js'
import { ui_display_number_as_str } from '../../utilities/ui_strings.js'
import { create_section,create_div } from '../../utilities/ui_elements.js'




class Search {

   // layout container
   #browse_results_container

   // we retain search state (search_term,page,etc) by passing a 'search_context'
   #search_context

   // props
   #props

   // advanced search is extended
   #show_advanced


   constructor(props) {
      // returning 'back to list' from Records will return the passed 'search_context'
      if(props) {
         console.log('Search()',props.context)
         this.#search_context = props.context
      }
      this.#props = props
   }


   render = async () => {

      let browse_section = create_section({
         attributes:[
            {key:'id',value:'browse_section'}
         ]
      })

      let search_status = create_section({
         attributes:[
            {key:'id',value:'search_status'}
         ],
         classlist:['p_0','bg_warning']
      })

      this.#browse_results_container = create_div({
         attributes:[
            {key:'id',value:'browse_results_container'}
         ]
      })


      // to do : get max len for search_term input from main process..
      let search_term_max_len = 36
      try {
         search_term_max_len = await window.app_api.maxSearchTermLen()
      }
      catch(error) {
         // we just use fallback initially assigned to search_term_max_len
      }
      
      let form_props = {
         search_term:this.#props ? this.#props.context.search_term : '',
         search_term_max_len:search_term_max_len,
         submit_search_term:this.submit_search_term,
         clear_search:this.clear_search
      }
         
      const search_form = new SearchForm(form_props)
      browse_section.append(search_form.render())
      setTimeout(() => search_form.activate(),100)
    
      let number_records = create_div({
         attributes:[
            {key:'id',value:'number_records'}
         ],
         classlist:['p_2']
      })

      // required for re-instating search_context on 'back' to list actions
      if(this.#search_context) {
         this.#browse_results_container.append(this.get_items())
      }

      // assemble
      browse_section.append(search_status,number_records,this.#browse_results_container)
      return browse_section
   }


   //
   // retrieve the paginated search results 
   //
   get_items = async () => {

      if(this.#search_context) {

         try {

            const collection_items_obj = await window.collection_items_api.searchCollectionItems(this.#search_context)   

            console.log(collection_items_obj)

            if (typeof collection_items_obj != "undefined") {
         
               if(collection_items_obj.outcome === 'success') {

                  this.#browse_results_container.replaceChildren()

                  let page_count = Math.ceil(collection_items_obj.count / collection_items_obj.per_page)

         
                  if(collection_items_obj.collection_items && collection_items_obj.collection_items.length > 0) {
                     
                     const top_pagination_nav = new PaginationNav('top',this.go_to_page,page_count,this.#search_context.page)
                     this.#browse_results_container.append(top_pagination_nav.render())
                     top_pagination_nav.activate()

                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = `${ui_display_number_as_str(collection_items_obj.count)} matching records were found.`
                     }
                     
                     let props = {
                        context:this.#search_context
                     }

                     const collection_item_card = new CollectionItemCard(props)
                     collection_items_obj.collection_items.forEach((item) => {        
                        this.#browse_results_container.appendChild(collection_item_card.render(collection_items_obj.collection_item_fields,item))
                     })
         
                     // retain some spacing on short lists
                     this.#browse_results_container.style.minHeight = '70vh' 
         
                     setTimeout(() => collection_item_card.activate(),200)

                     const bottom_pagination_nav = new PaginationNav('bottom',this.go_to_page,page_count,this.#search_context.page)  //this.go_to_page,page_count,this.#browse_context.page
                     this.#browse_results_container.append(bottom_pagination_nav.render())
                     bottom_pagination_nav.activate()
                  }
                  else {
                     this.#browse_results_container.innerText = 'No matching records were found. '
                  }

                  // re-instate scroll position if user had scrolled list before opening a record
                  window.scroll(0,this.#search_context.scroll_y)
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


   // callback for SearchForm
   submit_search_term = (search_context) => {
      this.#search_context = search_context
      this.#search_context.scroll_y = 0
      this.get_items()
   }

   //
   clear_search = () => {
      if(this.#browse_results_container) {
         this.#browse_results_container.replaceChildren()
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
   }


   // enable buttons/links displayed in the render
   activate = () => {

   }



}



export default Search