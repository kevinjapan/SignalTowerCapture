import { app } from '../../renderer.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import CollectionItemInjectForm from '../CollectionItemInjectForm/CollectionItemInjectForm.js'
import { init_card_img_loads,no_root_folder } from '../../utilities/ui_utilities.js'
import { create_section,create_div } from '../../utilities/ui_elements.js'



// FileInjector
// Displays either Add Record Form if a new item, or an existing Card if a matching record is found


class FileInjector {

   #props

   constructor(props) {
      this.#props = props
   }

   render = async() => {

      this.#props.root_folder = await app.get_root_folder()
      if(this.#props.root_folder === '') return no_root_folder()

      let file_injector = create_section()

      const outcome_classes = ['bg_lightgrey','mt_1','pl_1','pr_1']
      const outcome_attrs = [{key:'id',value:'export_csv_outcome'}]

      // do we have a matching existing 'file' type record?
      const matching_file_record = this.#props.find_matching_file_record(this.#props.file_name)

      // do we have a matching existing 'folder' type record?
      const matching_folder_record = this.#props.find_matching_folder_record(this.#props.file_name)
       
      // get list of fields in record
      const record_fields = this.#props.get_record_fields()

      if(matching_folder_record) {
         const check_outcome = create_div({
            classlist:outcome_classes,
            attributes:outcome_attrs,
            text:`There is an existing record for this folder. 
                  For a Folder type record, you only need to nominate a single record.
                  If you wish to have a separate record for any specific file, please
                  move that file out of this folder.`
         })
         file_injector.append(check_outcome)

         const collection_item_card = new CollectionItemCard(this.#props)
         file_injector.appendChild(collection_item_card.render(record_fields,matching_folder_record))
      }
      else if(matching_file_record) {
         // a matching record for this file was found
         const collection_item_card = new CollectionItemCard(this.#props)
         file_injector.appendChild(collection_item_card.render(record_fields,matching_file_record))       
      }
      else {
         // no matching record was found for this file
         const inject_form = new CollectionItemInjectForm(this.#props)
         file_injector.appendChild(await inject_form.render())
      }
      return file_injector
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
   }
}


export default FileInjector