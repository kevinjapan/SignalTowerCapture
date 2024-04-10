import App from '../App/App.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import { create_section,create_div,create_h } from '../../utilities/ui_elements.js'
import { get_title_from_filename } from '../../utilities/ui_strings.js'
import { no_root_folder } from '../../utilities/ui_utilities.js'


//
// Files - quick inject record into system
// honed-down alternative to CollectionItemForm for rapid multiple file injection 
// only includes field marked as 'injectable'
//

class CollectionItemInjectForm {

   // Collection root folder
   #root_folder = ''

   #props

   constructor(props) {
      this.#props = props
   }


   render = async() => {

      this.#root_folder = App.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()
            
      // component container
      const inject_form_container = create_section({
         classlist:['inject_form_container']
      })

      const heading = create_h({
         level:'h3',
         text:'Add Collection Item record',
         classlist:['border']
      })

      const item_form_wrap = create_section({
         attributes:[
            {key:'id',value:'item_form_wrap'}
         ],
         classlist:['border','inject_form']
      })
      
      // assemble
      this.build_form(item_form_wrap)
      inject_form_container.append(heading,item_form_wrap)
      return inject_form_container
   }

   build_form = async (item_form_wrap) => {

      try {
         const collection_item_obj = await window.collection_items_api.getCollectionItemFields()

         if (typeof collection_item_obj != "undefined") {

            // remove non-injectable fields
            let create_required_fields = collection_item_obj.fields.filter((field) => {
               return field.injectable
            })

            if(collection_item_obj.outcome === 'success') {

               // provide fields and enable 'back' from CollectionItemRecord view
               let props = {
                  fields:create_required_fields,
                  context:{
                     selected_folder:this.#props.folder_path,
                     ...this.#props.context
                  },
                  action:'add'
               }
               
               // display empty CollectionItemForm for data entry
               const collection_item_form = new CollectionItemForm(props)
               item_form_wrap.appendChild(await collection_item_form.render())
               collection_item_form.activate()
               collection_item_form.hydrate([
                  {field:'title',value:get_title_from_filename(this.#props.file_name)},
                  {field:'file_name',value:this.#props.file_name},
                  {field:'folder_path',value:this.#props.folder_path},
                  {field:'item_ref',value:'ASTM_ARCHIVE_'},     // future: have configurable for default ref naming prepend..
                  {field:'img',value:`${this.#root_folder}${this.#props.folder_path}\\${this.#props.file_name}`,alt:get_title_from_filename(this.#props.file_name)}
               ])
            }
            else {
               throw 'No records were returned.'
            }
         }
         else {
            throw 'No records were returned.'
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


   // enable buttons/links displayed in the render
   activate = () => {

   }

}



export default CollectionItemInjectForm