import App from '../App/App.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import TagsNavList from '../TagsNavList/TagsNavList.js'
import PaginationNav from '../PaginationNav/PaginationNav.js'
import { ui_display_number_as_str } from '../../utilities/ui_strings.js'
import { create_section,create_div } from '../../utilities/ui_elements.js'
import { init_card_img_loads,no_root_folder } from '../../utilities/ui_utilities.js'


// to do :
// - tidy UI of nav selectors (tags) at top of page
// - display paginated results for each tag

class Tags {

   #tags_section = null

   // layout container
   #tags_results_container = null

   #tags_context = {
      key:'Tags',
      field_filters:[
         {
            field:'tags',
            test:'LIKE',
            value:''
         }
      ],
      page:1,
      scroll_y:0
   }

   #tags_search_term

   // props
   #props

   // ensure we keep in the Collections folders
   #root_folder


   constructor(props) {
      // returning 'back to list' from Records will return the passed 'tags_context'
      if(props) this.#tags_context = props.context
      this.#props = props
   }

   render = async() => {

      this.#root_folder = await App.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()

      this.#tags_section = create_section({
         attributes:[{key:'id',value:'tags_section'}],
         classlist:['fade_in','max_w_full','pt_1']
      })

      let tags_status = create_section({
         attributes:[{key:'id',value:'tags_status'}],
         classlist:['p_0','bg_warning']
      })

      this.#tags_results_container = create_div({
         attributes:[{key:'id',value:'tags_results_container'}],
         classlist:['grid','grid_cards_layout']
      })
      
      await this.add_tags_nav()    
      this.add_number_results()

      // required for re-instating tags_context on 'back' to list actions
      if(this.#tags_context) {
         if(this.#tags_context.tags_search_term !== undefined)   // to do : adapt to Tags from Search
            this.#tags_results_container.append(this.get_items())
      }

      window.scroll(0,0)
      
      // assemble
      // this.#tags_section.append(tags_status,this.#tags_results_container)
      return this.#tags_section
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
   }


   // retrieve the paginated Tags results 
   get_items = async () => {

      if(this.#tags_context) {

         const updated_field_filters = this.#tags_context.field_filters.map(field => {
            if(field.field === 'tags') {
               field.value = this.#tags_search_term
               return field
            }
         })
         this.#tags_context.field_filters = updated_field_filters
         
         try {
            const collection_items_obj = await window.collection_items_api.getItems(this.#tags_context)

            if (typeof collection_items_obj != "undefined") {
               if(collection_items_obj.outcome === 'success') {

                  // re-assemble
                  this.#tags_section.replaceChildren()
                  this.#tags_results_container.replaceChildren()
                  
                  await this.add_tags_nav(this.#tags_context.tags_search_term)
                  this.add_number_results()
                  
                  let page_count = Math.ceil(collection_items_obj.count / collection_items_obj.per_page)

                  if(collection_items_obj.collection_items && collection_items_obj.collection_items.length > 0) {
                     
                     const top_pagination_nav = new PaginationNav('top',this.go_to_page,page_count,this.#tags_context.page)
                     this.#tags_section.append(top_pagination_nav.render())
                     top_pagination_nav.activate()

                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = `${ui_display_number_as_str(collection_items_obj.count)} matching records were found.`
                     }
                     
                     let props = {
                        root_folder: this.#root_folder,
                        context:this.#tags_context
                     }
                     const collection_item_card = new CollectionItemCard(props)
                     if(Array.isArray(collection_items_obj.collection_items)) {
                        collection_items_obj.collection_items.forEach((item) => {        
                           this.#tags_results_container.appendChild(collection_item_card.render(collection_items_obj.collection_item_fields,item))
                        })
                     }
         
                     // retain some spacing on short lists
                     this.#tags_results_container.style.minHeight = '70vh' 
         
                     this.#tags_section.append(this.#tags_results_container)
                     setTimeout(() => collection_item_card.activate(),200)

                     const bottom_pagination_nav = new PaginationNav('bottom',this.go_to_page,page_count,this.#tags_context.page)  //this.go_to_page,page_count,this.#browse_context.page
                     this.#tags_section.append(bottom_pagination_nav.render())
                     bottom_pagination_nav.activate()

                  }
                  else {
                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = 'No matching records were found. '
                     }
                  }

                  // re-instate scroll position if user had scrolled list before opening a record
                  setTimeout(() => window.scroll(0,this.#tags_context.scroll_y),100)
               }
               else {
                  let tags_status = document.getElementById('tags_status')
                  if(tags_status) {
                     tags_status.innerText = collection_items_obj.message
                  }
               }
            }
            else {
               throw 'No search results were returned.'
            }
         }
         catch(error) {
            App.switch_to_component('Error',{
               msg:'Sorry, we were unable to access the Records.',
               error:error
            })
         }
      }
      else {
         return null
      }
   }

   add_tags_nav = async(tags_search_term) => {

      // to do : display tag nav items - adapt this block from Search
      
      let props = {
         tags_search_term:tags_search_term,
         submit_tags_search_term:this.submit_tags_search_term,
         clear_search:this.clear_search
      }
      const tags_nav = new TagsNavList(props)
      const tags_nav_elem = await tags_nav.render()
      if(tags_nav_elem) {
         this.#tags_section.append(tags_nav_elem)
      }
      else {
         this.#tags_section.append(create_div({
            classlist:['bg_inform','p_1','fit_content','rounded'],
            text:'There are no Tags configured in the system. You can add Tags in the Config menu.'
         }))
      }
      setTimeout(() => tags_nav.activate(),100)
   }

   add_number_results = () => {
      this.#tags_section.append(create_div({
         attributes:[{key:'id',value:'number_records'}],
         classlist:['p_.5','pt_1','text_center']
      }))
   }

   // callback for SearchForm
   submit_tags_search_term = (tags_search_term) => {
      if(tags_search_term) {
         this.#tags_search_term = tags_search_term
         this.#tags_context.scroll_y = 0
      }
      this.get_items()
      setTimeout(() => this.activate(),200)
   }

   //
   clear_search = () => {
      if(this.#tags_results_container) {
         this.#tags_results_container.replaceChildren()
      }
      let number_records = document.getElementById('number_records')
      if(number_records) number_records.innerText = ''
   }

   // callback for PageNavigation
   go_to_page = (page) => {
      this.#tags_context.page = page
      this.#tags_context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),200)
   }
}

export default Tags