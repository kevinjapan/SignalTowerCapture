import { app } from '../../renderer.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import { create_section,create_h,create_p } from '../../utilities/ui_elements.js'
import { get_title_from_filename } from '../../utilities/ui_strings.js'
import { no_root_folder, no_root_elem } from '../../utilities/ui_utilities.js'



// Files - quick inject (add) Record into system
// honed-down alternative to CollectionItemForm for rapid multiple file injection 
// only includes fields marked as 'injectable'


class CollectionItemInjectForm {

   // Collection root folder
   #root_folder = ''

   #props


   constructor(props) {
      this.#props = props
   }

   render = async() => {

      this.#root_folder = app.get_root_folder()
      if(this.#root_folder === '') return no_root_elem()
            
      // component container
      const inject_form_container = create_section({
         classlist:['inject_form_container']
      })

      const heading = create_h({
         level:'h3',
         text:'Add Collection Item record'
      })
      const text = create_p({
         text:'You can proceed to add a record for this file.'
      })

      const item_form_wrap = create_section({
         attributes:[{key:'id',value:'item_form_wrap'}],
         classlist:['inject_form']
      })
      
      // assemble
      this.inject_form_into(item_form_wrap)
      inject_form_container.append(heading,text,item_form_wrap)
      return inject_form_container
   }

   inject_form_into = async (item_form_wrap) => {

      try {
         const collection_item_obj = await window.collection_items_api.getCollectionItemFields()

         if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {

            // remove non-injectable fields
            let create_required_fields = collection_item_obj.fields.filter((field) => {
               return field.injectable
            })

            // provide fields and enable 'back' from CollectionItemRecord view
            let props = {
               fields:create_required_fields,
               context:{
                  selected_folder:this.#props.folder_path,
                  find_files:false,
                  ...this.#props.context
               },
               action:'add'
            }
            
            // display empty CollectionItemForm for data entry
            // allowing for empty folder_path (files in root_folder)
            const collection_item_form = new CollectionItemForm(props)
            item_form_wrap.appendChild(await collection_item_form.render())
            collection_item_form.activate()
            collection_item_form.hydrate([
               {field:'title',value:get_title_from_filename(this.#props.file_name)},
               {field:'file_name',value:this.#props.file_name},
               {field:'folder_path',value:this.#props.folder_path},
               {field:'item_ref',value:'ASTM_ARCHIVE_'},
               {
                  field:'img',
                  value:`${this.#root_folder}${this.#props.folder_path === '\\' ? '' : this.#props.folder_path + '\\'}${this.#props.file_name}`,
                  alt:get_title_from_filename(this.#props.file_name)
               }
            ])
         }
         else {
            throw 'No records were returned.'
         }
      }
      catch(error) {
         app.switch_to_component('Error',{
            msg:'Sorry, we were unable to access the Records.',
            error:error
         },false)
      }
   }

   // enable buttons/links displayed in the render
   activate = () => {
      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {
         apply_btns.forEach((apply_btn) => {
            apply_btn.classList.remove('dimmer')
         })
      }
   }

}



export default CollectionItemInjectForm