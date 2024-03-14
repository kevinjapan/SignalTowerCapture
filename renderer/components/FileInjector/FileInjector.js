import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import CollectionItemInjectForm from '../CollectionItemInjectForm/CollectionItemInjectForm.js'
import { init_card_img_loads } from '../../utilities/ui_utilities.js'
import { trim_end_char } from '../../utilities/ui_strings.js'
import { create_section,create_p,create_div } from '../../utilities/ui_elements.js'

class FileInjector {

   #props

   constructor(props) {
      this.#props = props
   }


   render = async() => {
      
      // get root_folder
      const app_config_obj = await window.config_api.getAppConfig()
      if(app_config_obj.outcome === 'success') {      
         this.#props.root_folder = trim_end_char(app_config_obj.app_config.root_folder,'\\')            
      }

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
            text:`There is a record for this folder. 
                  For a Folder type record, you only need to nominate a single record.
                  If you wish to have a separate record for any specific file, please
                  move that file out of this folder.`
         })
         // assemble
         file_injector.append(check_outcome)

         const collection_item_card = new CollectionItemCard(this.#props)
         file_injector.appendChild(collection_item_card.render(record_fields,matching_folder_record))

         setTimeout(() => collection_item_card.activate(),200)

      }
      else if(matching_file_record) {

         // a matching record for this file was found
         const check_outcome = create_div({
            classlist:outcome_classes,
            attributes:outcome_attrs,
            text:`There is a record for this file.`
         })
         
         // assemble
         file_injector.append(check_outcome)

         const collection_item_card = new CollectionItemCard(this.#props)
         file_injector.appendChild(collection_item_card.render(record_fields,matching_file_record))

         setTimeout(() => collection_item_card.activate(),200)
         
      }
      else {         

         // no matching record was found for this file         
         const check_outcome = create_div({
            classlist:outcome_classes,
            attributes:outcome_attrs,
            text:'There is no record for this file, please add a new record.'
         })
         const file = create_p({
            text:this.#props.file
         })
   
         // assemble
         file_injector.append(check_outcome,file)
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