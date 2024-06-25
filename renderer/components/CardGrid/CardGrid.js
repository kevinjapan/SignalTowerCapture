import { app } from '../../renderer.js'
import AppStatus from '../AppStatus/AppStatus.js'
import { create_div } from '../../utilities/ui_elements.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'



// wrapper for grid (list) of Cards
// returns container element for Card and provides handlers for click events on Cards

class CardGrid {

   #props

   #grid

   constructor(props) {
      if(props) {
         this.#props = props
         if(props.container_id === undefined) this.#props.container_id = 'cardgrid'
      }
   }

   render = (initial_text = '') => {
      this.#grid = create_div({
         attributes:[{key:'id',value:this.#props.container_id}],
         classlist:['grid','grid_cards_layout','text_center','text_grey'],
         text: initial_text
      })      
      // retain some spacing on short lists
      this.#grid.style.minHeight = '70vh'
      return this.#grid
   }

   activate = () => {
         
      // handle clicks on Cards
      const collection_item_cards = document.querySelectorAll('.collection_item_card')   
      if(collection_item_cards) {   
         collection_item_cards.forEach(collection_item_card => {            
            //
            // Open Record from Card
            //
            collection_item_card.addEventListener('click', async(event) => {               
               if(typeof collection_item_card.attributes['data-id'] !== 'undefined') {
                  try {                     
                     const collection_item_obj = await window.collection_items_api.getCollectionItem(parseInt(collection_item_card.attributes['data-id'].value))

                     if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {
                        if(await is_valid_response_obj('read_single_collection_item',collection_item_obj)) {
                           
                           let { collection_item_fields,collection_item } = collection_item_obj
                        
                           let component_container = document.getElementById('component_container')
                           if(component_container) {
                              let record_props = {
                                 fields:collection_item_fields,
                                 item:collection_item
                              }
                              // we hydrate context for target CollectionItemRecord here since we need to inject 'id' into History context
                              record_props.context = {key:'Record',id:collection_item.id}
                              // add scroll pos to page's context (retains pos on 'back')
                              const history = app.get_service('history')
                              if(history) history.augment_current_context({scroll_y:window.scrollY})                              
                              app.switch_to_component('Record',record_props)
                           }
                        }
                        else {
                           app.switch_to_component('Error',{
                              msg:'Sorry, we were unable to process an invalid response from the main process in CollectionItemCard.'
                           },false)
                        }
                     }
                     else {
                        throw 'No records were returned in CollectionItemCard.'
                     }
                  }
                  catch(error) {
                     app.switch_to_component('Error',{
                        msg:'Sorry, we were unable to access the Records from the CollectionItemCard',
                        error:error
                     },false)
                  }
               }
               else {
                  let props = {msg:'Sorry, no valid id was provided for the Collection Item in ColletionItemCard.'}
                  app.switch_to_component('Error',props,false)
               }
            })
         })
      }

      //
      // Card context menus
      //
      const context_menu_btns = document.querySelectorAll('.context_menu_btn')   
      if(context_menu_btns) {   
         context_menu_btns.forEach(context_menu_btn => {
            // Open Context Menu
            context_menu_btn.addEventListener('click',(event) => {
               event.stopPropagation()
               // find matching context_menu and display it
               const item_id = event.target.getAttribute('data-id')
               const context_menu = document.getElementById(`context_menu_${item_id}`)
               if(context_menu) context_menu.classList.toggle('opened')
            })
         })
      }

      //
      // Prevent click on Context Menu & Ctrls from opening a record
      //
      const card_context_menus = document.querySelectorAll('.card_context_menu')
      if(card_context_menus) {
         card_context_menus.forEach(card_context_menu => {
            card_context_menu.addEventListener('click',(event) => {
               event.stopPropagation()
            })
         })
      }
      const card_ctrls = document.querySelectorAll('.card_ctrls')
      if(card_ctrls) {
         card_ctrls.forEach(card_ctrl=> {
            card_ctrl.addEventListener('click',(event) => {
               event.stopPropagation()
            })
         })
      }

      

      //
      // Card Context Menu links
      //
      const context_links = document.querySelectorAll('.card_context_menu_link')
      if(context_links) {
         context_links.forEach(context_link => {
            context_link.addEventListener('click',async(event) => {
               event.stopPropagation()
               const record_id = event.target.getAttribute('id')
               const title = event.target.getAttribute('data-title')
               const action = event.target.getAttribute('data-action')
               switch(action) {
                  case 'delete':
                     const result = await window.collection_items_api.deleteCollectionItem(record_id)
                     if(result.outcome === 'success'){                        
                        AppStatus.notify(`Successfully deleted Record - "${title}"`)
                        this.#props.refresh()
                     }
                     else {

                     }


                     break

                  case 'tag':

                     // to do : provide in-situ list of tags w/ checkboxes

                     break
               }
            })
         })
      }
   }
}



export default CardGrid