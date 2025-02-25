import { app } from '../../renderer.js'
import CardGrid from '../CardGrid/CardGrid.js'
import CollectionItemCard from '../CollectionItems/CollectionItemCard/CollectionItemCard.js'
import CollectionItemInjectForm from '../CollectionItems/CollectionItemInjectForm/CollectionItemInjectForm.js'
import { init_card_img_loads,no_root_folder } from '../../utilities/ui_utilities.js'
import { create_section,create_div } from '../../utilities/ui_elements.js'



// FileInjector
// Displays either Add Record Form if a new item, or an existing Card if a matching record is found


class FileInjector {

   #props
   
   // CardGrid object
   #card_grid_obj

   // 
   #card_wrapper_elem

   // CollectionItems list
   // to support context_menu on Card, we retain list of the single record we can show at a time
   #items

   constructor(props) {
      this.#props = props
   }

   render = async() => {

      this.#props.root_folder = app.get_root_folder()
      if(this.#props.root_folder === '') return no_root_folder()

      let file_injector = create_section({attributes:[{key:'id',value:'file_injector'}]})

      // grid wrapper
      this.#card_grid_obj = new CardGrid({
         container_id:'card_wrapper',
         refresh:this.refresh,
         get_item:this.get_item
      })
      this.#card_wrapper_elem = this.#card_grid_obj.render()

      await this.hydrate(file_injector)

      return file_injector
   }


   hydrate = async(container) => {

      if(container) {

         container.replaceChildren()

         // do we have a matching existing 'file' type record?
         const matching_file_record = this.#props.find_matching_file_record(this.#props.file_name)

         // do we have a matching existing 'folder' type record?
         const matching_folder_record = this.#props.find_matching_folder_record(this.#props.file_name)
         
         // get list of fields in record
         const record_fields = this.#props.get_record_fields()

         if(matching_folder_record) {
            const check_outcome = create_div({
               classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
               attributes:[{key:'id',value:'export_csv_outcome'}],
               text:`There is an existing record for this folder. 
                     For a Folder type record, you only need to nominate a single record.
                     If you wish to have a separate record for any specific file, please
                     move that file out of this folder.`
            })
            container.append(check_outcome)

            const collection_item_card = new CollectionItemCard(this.#props)
            this.#card_wrapper_elem.appendChild(collection_item_card.render(record_fields,matching_folder_record))
            container.append(this.#card_wrapper_elem) 
         }
         else if(matching_file_record) {
            // a matching record for this file was found
            const collection_item_card = new CollectionItemCard(this.#props) 
            this.#card_wrapper_elem.appendChild(collection_item_card.render(record_fields,matching_file_record))
            container.append(this.#card_wrapper_elem) 
         }
         else {
            // no matching record was found for this file
            const inject_form = new CollectionItemInjectForm(this.#props)
            container.appendChild(await inject_form.render())

            // initialize form - we enable apply btns since we have a known file (default is disabled w/ '.dimmer')
            setTimeout(() => inject_form.activate(),300)
         }
      }
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
      this.#card_grid_obj.activate()      
      const collection_item_cards = document.querySelectorAll('.collection_item_card')   
      if(collection_item_cards) {   
         collection_item_cards.forEach(card => {
            card.classList.add('box_shadow')
         })
      }
   }


   // grid can request refresh
   refresh = async() => {

      // update matching_records lookup in Files component (we likely have changed status of a record)
      await this.#props.refresh()
    
      const file_injector = document.getElementById('file_injector')
      if(file_injector) {
         this.hydrate(file_injector)
      }
   }

   get_item = (id) => {
      return this.#items.find(item => {
         return item.id === parseInt(id)
      })
   }
}


export default FileInjector