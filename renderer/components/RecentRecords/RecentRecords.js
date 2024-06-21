import { app } from '../../renderer.js'
import CardGrid from '../CardGrid/CardGrid.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import PageBanner from '../PageBanner/PageBanner.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import { create_section } from '../../utilities/ui_elements.js'
import { ui_display_number_as_str } from '../../utilities/ui_strings.js'
import { init_card_img_loads,no_root_folder } from '../../utilities/ui_utilities.js'



class RecentRecords {

   #props

   #queue

   // Page Context (State)
   #context = {
      key:'RecentRecords',
      field_filters:[],
      page:-1,
      scroll_y:0
   }

   #results_container

   // wrapper for grid element and click handler
   #card_grid_obj

   #root_folder

   
   constructor(props) {
      this.#props = props
      if(props) this.#context = props.context
   }

   render = async() => {

      this.#root_folder = await app.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()

      const record_result_obj = await this.get_app_config_record()
      const app_config_record = record_result_obj.app_config

      this.#queue = app_config_record.recent_records

      const recent_section = create_section({
         attributes:[{key:'id',value:'recent_section'}],
         classlist:['px_1','pb_1']
      })
      
      const page_banner = new PageBanner({
         icon_name:'files',
         title:'Recent Records',
         lead:'Re-visit the most recently viewed records.'
      })

      // grid wrapper
      this.#card_grid_obj = new CardGrid('results_container')
      this.#results_container = this.#card_grid_obj.render()

      this.get_items()
      window.scroll(0,0)

      // assemble
      recent_section.append(
         page_banner.render(),
         this.#results_container
      )
      return recent_section
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
      this.#card_grid_obj.activate()
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
                        number_records.innerText = `There ${parseInt(count) === 1 ? 'is' : 'are'} ${ui_display_number_as_str(count)} deleted record${parseInt(count) === 1 ? '' : 's'}.`
                     }            
                     let props = {
                        root_folder: this.#root_folder,
                        context: this.#context
                     }
                     const collection_item_card = new CollectionItemCard(props)
                     for(const item of ordered_items) { 
                        this.#results_container.appendChild(collection_item_card.render(collection_item_fields,item))
                     }
         
                     // retain some spacing on short lists
                     this.#results_container.style.minHeight = '70vh'
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
               },false)
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
   
   get_default_context = () => {
      return this.#context
   }
}


export default RecentRecords