import App from '../App/App.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import PaginationNav from '../PaginationNav/PaginationNav.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import { ui_display_number_as_str } from '../../utilities/ui_strings.js'
import { DESC } from '../../utilities/ui_descriptions.js'
import { init_card_img_loads,no_root_folder } from '../../utilities/ui_utilities.js'
import { 
   create_section,
   create_div,
   create_h,
   create_p
} from '../../utilities/ui_elements.js'




class DeletedRecordsTeaser {

   #deleted_records_section

   #results_container

   // we retain browse state (page,scroll_y,etc) by passing a 'context token'
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
      if(props) {
         this.#context = props.context
      }
      this.#props = props
   }

   
   render = async() => {

      this.#root_folder = App.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()

      this.#deleted_records_section = create_section({
         attributes:[
            {key:'id',value:'deleted_records_section'}
         ],
         classlist:['ui_component']
      })

      this.add_heading()
      this.add_desc()
      this.add_number_results()

      this.#results_container = create_div({
         attributes:[
            {key:'id',value:'results_container'}
         ],
         classlist:['deleted_records','grid','grid_cards_layout','']
      })

      // required for re-instating search_context on 'back' to list actions
      if(this.#context) {
         this.#results_container.append(this.get_items())
      }

      return this.#deleted_records_section
   }

   //
   // retrieve the paginated items results 
   // 
   get_items = async () => {

      if(this.#context) {

         try {

            const collection_items_obj = await window.collection_items_api.getItems(this.#context)
         
            if (typeof collection_items_obj != "undefined" && collection_items_obj.outcome === 'success') {
                  
               if(await is_valid_response_obj('read_collection_items',collection_items_obj)) {

                  this.#deleted_records_section.replaceChildren()
                  this.#results_container.replaceChildren()
                  
                  this.add_heading()
                  this.add_desc()
                  this.add_number_results()

                  let page_count = Math.ceil(collection_items_obj.count / collection_items_obj.per_page)

                  const top_pagination_nav = new PaginationNav('top',this.go_to_page,page_count,this.#context.page)
                  this.#deleted_records_section.append(top_pagination_nav.render())
                  top_pagination_nav.activate()
         
                  if(collection_items_obj.collection_items.length > 0) {
                  
                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = `There are ${ui_display_number_as_str(collection_items_obj.count)} deleted records.`
                     }
            
                     let props = {
                        root_folder: this.#root_folder,
                        context: this.#context
                     }
                     const collection_item_card = new CollectionItemCard(props)

                     if(Array.isArray(collection_items_obj.collection_items)) {
                        collection_items_obj.collection_items.forEach((item) => {        
                           this.#results_container.appendChild(collection_item_card.render(collection_items_obj.collection_item_fields,item))
                        })
                     }
         
                     // retain some spacing on short lists
                     this.#results_container.style.minHeight = '70vh'
         
                     setTimeout(() => collection_item_card.activate(),200)
                  }
                  else {
                     this.#results_container.innerText = 'No records were found. '
                  }
                  
                  this.#deleted_records_section.append(this.#results_container)

                  const bottom_pagination_nav = new PaginationNav('bottom',this.go_to_page,page_count,this.#context.page)
                  this.#deleted_records_section.append(bottom_pagination_nav.render())
                  bottom_pagination_nav.activate()
                  
                  // re-instate scroll position if user had scrolled list before opening a record
                  window.scroll(0,this.#context.scroll_y)
               }
               else {
                  App.switch_to_component('Error',{
                     msg:'Sorry, we were unable to process an invalid response from the main process in DeletedRecords.'
                  })
               }
            }
            else {
               throw 'No records were returned. ' + collection_items_obj.message ? collection_items_obj.message : ''
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
      this.#context.page = page
      this.#context.scroll_y = 0
      this.get_items()
   }
   
   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
   }

   
   add_heading = () => {
      const h = create_h({
         level:'h4',
         text:'Deleted Records'
      })
      this.#deleted_records_section.append(h)
   }

   add_desc = () => {
      let desc_text = DESC.DELETED_RECORDS
      const desc = create_p({text:desc_text})
      this.#deleted_records_section.append(desc)
   }

   add_number_results = () => {
      this.#deleted_records_section.append(create_div({
         attributes:[
            {key:'id',value:'number_records'}
         ],
         classlist:['p_2']
      }))
   }

}



export default DeletedRecordsTeaser