import { app } from '../../renderer.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import PageBanner from '../PageBanner/PageBanner.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import { create_section,create_h,create_div,create_p } from '../../utilities/ui_elements.js'
import { ui_display_number_as_str } from '../../utilities/ui_strings.js'
import { init_card_img_loads,no_root_folder } from '../../utilities/ui_utilities.js'


class RecentRecords {

   #props

   #queue

   // we retain browse state (page,scroll_y,etc) by passing a 'context token'
   #context = {
      key:'RecentRecords',
      field_filters:[],
      page:-1,
      scroll_y:0
   }

   #results_container

   #root_folder

   
   constructor(props) {
      this.#props = props
      if(props) this.#context = props.context
   }

   render = async() => {

      this.#root_folder = await app.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()

      let record_result_obj = await this.get_app_config_record()
      let app_config_record = record_result_obj.app_config

      this.#queue = app_config_record.recent_records

      let recent_section = create_section({
         attributes:[{key:'id',value:'recent_section'}]
      })  

      
      const page_banner = new PageBanner({
         icon_name:'files',
         title:'Recent Records',
         lead:'Revisit the most recently viewed records here.'
      })


      this.#results_container = create_div({
         attributes:[{key:'id',value:'results_container'}],
         classlist:['grid','grid_cards_layout']
      })

      this.get_items()
      window.scroll(0,0)

      // assemble
      recent_section.append(page_banner.render(),this.#results_container)
      return recent_section
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
   }

   async get_app_config_record() {
      return await window.config_api.getAppConfig()
   }

   // retrieve the items results (w/ no pagination)
   get_items = async () => {

      if(this.#context) {
         try {
            this.#context.field_filters.push({
                  field:'id',
                  test:'IN',
                  value:this.#queue
            })

            const collection_items_obj = await window.collection_items_api.getItems(this.#context)
         
            if (typeof collection_items_obj != "undefined" && collection_items_obj.outcome === 'success') {                  
               if(await is_valid_response_obj('read_collection_items',collection_items_obj)) {

                  let { count,collection_item_fields,collection_items } = collection_items_obj

                  this.#results_container.replaceChildren()
                  let ordered_items = []
                  this.#queue.split(',').forEach(id => {
                     let temp = collection_items.find(item => {
                        return parseInt(item.id) === parseInt(id)
                     })
                     if(temp) ordered_items.push(temp)
                  })

                  if(ordered_items.length > 0) {
                  
                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = `There are ${ui_display_number_as_str(count)} deleted records.`
                     }            
                     let props = {
                        root_folder: this.#root_folder,
                        context: this.#context
                     }
                     const collection_item_card = new CollectionItemCard(props) 
                     ordered_items.forEach((item) => {  
                        this.#results_container.appendChild(collection_item_card.render(collection_item_fields,item))
                     })
         
                     // retain some spacing on short lists
                     this.#results_container.style.minHeight = '70vh'
         
                     setTimeout(() => collection_item_card.activate(),200)
                  }
                  else {
                     this.#results_container.innerText = 'No records were found. '
                  }
                  
                  // re-instate scroll position if user had scrolled list before opening a record
                  setTimeout(() => window.scroll(0,this.#context.scroll_y),100)
               }            
               else {
                  throw 'No records were returned. ' + collection_items_obj.message ? collection_items_obj.message : ''
               }
            }
            else {
               app.switch_to_component('Error',{
                  msg:'Sorry, we were unable to process an invalid response from the main process in RecentRecords.'
               })
            }
         }
         catch(error) {
            app.switch_to_component('Error',{
               msg:'Sorry, we were unable to access the Records.',
               error:error
            })
         }
      }
   }
   
   get_default_context = () => {
      return this.#context
   }
}


export default RecentRecords