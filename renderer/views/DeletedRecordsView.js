import { app } from '../renderer.js'
import CardGrid from '../components/CardGrid/CardGrid.js'
import CollectionItemCard from '../components/CollectionItems/CollectionItemCard/CollectionItemCard.js'
import PaginationNav from '../components/PaginationNav/PaginationNav.js'
import PageBanner from '../components/PageBanner/PageBanner.js'
import { is_valid_response_obj } from '../utilities/ui_response.js'
import { ui_display_number_as_str } from '../utilities/ui_strings.js'
import { DESC } from '../utilities/ui_descriptions.js'
import { init_card_img_loads,no_root_folder, no_root_elem } from '../utilities/ui_utilities.js'
import { create_section,create_div } from '../utilities/ui_elements.js'



class DeletedRecordsView {

   // Component container element
   #deleted_records_section

   // pagination
   #pagination_nav

   // CardGrid object
   #card_grid_obj

   // Cards grid container element
   #results_container

   // CollectionItems list
   #items

   // Page Context (State)
   #context = {
      key:'DeletedRecords',
      filters:{
         record_status:'deleted_records',
         order_by:'deleted_at',
         order_by_direction:'DESC'
      },
      page:1,
      scroll_y:0
   }
         
   // props 
   #props = null
   
   #root_folder


   constructor(props) {
      // returning 'back to list' from Records will return the passed 'context token'
      if(props) this.#context = props.context
      this.#props = props
   }
   
   render = async() => {

      this.#root_folder = app.get_root_folder()
      if(this.#root_folder === '') return no_root_elem()

      this.#deleted_records_section = create_section({
         attributes:[{key:'id',value:'deleted_records_section'}],
         classlist:['px_1']
      })

      const page_banner = new PageBanner({
         icon_name:'deleted',
         title:'Deleted Records',
         lead:DESC.DELETED_RECORDS
      })

      const num_records = this.add_number_results()

      this.#pagination_nav = new PaginationNav()

      // grid wrapper
      this.#card_grid_obj = new CardGrid(
         {container_id:'results_container',
         refresh:this.refresh,
         get_item:this.get_item
         })
      this.#results_container = this.#card_grid_obj.render()

      // required for re-instating search_context on 'back' to list actions
      if(this.#context) this.#results_container.append(this.get_items())
         
      // assemble
      this.#deleted_records_section.append(
         page_banner.render(),
         num_records,
         this.#pagination_nav.render(),
         this.#results_container,
         this.#pagination_nav.render()
      )

      return this.#deleted_records_section
   }


   // retrieve the paginated items results 
   get_items = async () => {

      if(this.#context) {
         try {
            const collection_items_obj = await window.collection_items_api.getItems(this.#context)
         
            if (typeof collection_items_obj != "undefined" && collection_items_obj.outcome === 'success') {                  
               if(await is_valid_response_obj('read_collection_items',collection_items_obj)) {

                  this.#items = collection_items_obj.collection_items

                  let { count,per_page,collection_item_fields,collection_items } = collection_items_obj

                  this.#results_container.replaceChildren()          

                  let page_count = Math.ceil(count / per_page)

                  if(collection_items.length > 0) {
                  
                     let number_records = document.getElementById('number_records')
                     if(number_records) {
                        number_records.innerText = `There ${parseInt(count) === 1 ? 'is' : 'are'} ${ui_display_number_as_str(count)} deleted record${parseInt(count) === 1 ? '' : 's'}.`
                     }
            
                     let props = {
                        root_folder: this.#root_folder,
                        context: this.#context
                     }
                     const collection_item_card = new CollectionItemCard(props)

                     if(Array.isArray(collection_items)) {
                        for(const item of collection_items) { 
                           this.#results_container.appendChild(collection_item_card.render(collection_item_fields,item))
                        }
                     }
         
                     // retain some spacing on short lists
                     this.#results_container.style.minHeight = '70vh'
                  }
                  else {
                     this.#results_container.innerText = 'No records were found. '
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
                  
                  // re-instate scroll position if user had scrolled list before opening a record
                  window.scroll(0,this.#context.scroll_y)
               }
               else {
                  app.switch_to_component('Error',{
                     msg:'Sorry, we were unable to process an invalid response from the main process in DeletedRecords.'
                  },false)
               }
            }
            else {
               throw 'No records were returned. ' + collection_items_obj.message ? collection_items_obj.message : ''
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
      this.#context.page = page
      this.#context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),200)
   }
   
   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
      if(this.#card_grid_obj) this.#card_grid_obj.activate()
      if(this.#pagination_nav) this.#pagination_nav.activate() 
   }
   
   add_number_results = () => {
      return create_div({
         attributes:[{key:'id',value:'number_records'}],
         classlist:['text_center','p_2']
      })
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


export default DeletedRecordsView