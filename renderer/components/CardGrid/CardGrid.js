import { app } from '../../renderer.js'
import { create_div } from '../../utilities/ui_elements.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'



// wrapper for grid (list) of Cards
// returns container element for Cards and provides handler for click events


class CardGrid {

   #props

   #element_id

   constructor(element_id) {
      this.#element_id = element_id
   }

   render = () => {

      const grid = create_div({
         attributes:[{key:'id',value:this.#element_id}],
         classlist:['grid','grid_cards_layout']
      })
      
      // retain some spacing on short lists
      grid.style.minHeight = '70vh' 

      return grid
   }

   // t do : this.#props - what was Browse previously passing in?

   activate = () => {
         
      // handle clicks on Cards
      const collection_item_cards = document.querySelectorAll('.collection_item_card')   
      if(collection_item_cards) {   
         collection_item_cards.forEach(collection_item_card => {
            collection_item_card.addEventListener('click', async(event) => {               
               if(typeof collection_item_card.attributes['data-id'] !== 'undefined') {
                  try {
                     const collection_item_obj = await window.collection_items_api.getCollectionItem(collection_item_card.attributes['data-id'].value)

                     if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {
                        if(await is_valid_response_obj('read_single_collection_item',collection_item_obj)) {
                           
                           let { collection_item_fields,collection_item } = collection_item_obj
                        
                           let component_container = document.getElementById('component_container')
                           if(component_container) {
                              let record_props = {
                                 fields:collection_item_fields,
                                 item:collection_item,
                                 ...this.#props
                              }
                              // we hydrate context for target CollectionItemRecord here since we need to inject 'id' into History context
                              record_props.context = {key:'Record',id:collection_item.id}
                              
                              // record_props.context.scroll_y = window.scrollY
                              app.switch_to_component('Record',record_props)
                           }
                        }
                        else {
                           app.switch_to_component('Error',{
                              msg:'Sorry, we were unable to process an invalid response from the main process in CollectionItemCard.'
                           })
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
                     })
                  }
               }
               else {
                  let props = {msg:'Sorry, no valid id was provided for the Collection Item in ColletionItemCard.'}
                  app.switch_to_component('Error',props)
               }
            })
         })
      }
   }

}



export default CardGrid