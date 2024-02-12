import App from '../App/App.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import { create_section,create_div,create_h } from '../../utilities/ui_elements.js'
import { is_image_file, build_img_elem } from '../../utilities/ui_utilities.js'
import { trim_end_char } from '../../utilities/ui_strings.js'


//
// Files - quick inject record into system
// shortcut honed-down alternative to CollectionItemForm for rapid multiple file injection 
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

      // get root_folder
      const app_config_obj = await window.config_api.getAppConfig()
      if(app_config_obj.outcome === 'success') {
         this.#root_folder = trim_end_char(app_config_obj.app_config.root_folder,'\\')                 
      }
            
      // component container
      const inject_form_container = create_section()

      const heading = create_h({
         level:'h1',
         text:'Collection Item Inject Form'
      })

      const item_form_wrap = create_section({
         attributes:[
            {key:'id',value:'item_form_wrap'}
         ],
         classlist:['border','bg_yellow']
      })

      // let file_path = `${this.#root_folder}\\${this.#props.folder_path}\\${this.#props.file_name}`
      // await this.display_if_img_file(img_block,file_path,this.get_title_from_filename(this.#props.file_name))
      
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

               let props = {
                  fields:create_required_fields
               }
               
               // display empty CollectionItemForm for data entry
               const collection_item_form = new CollectionItemForm(props)
               item_form_wrap.appendChild(await collection_item_form.render())
               collection_item_form.activate('add')
               collection_item_form.hydrate([
                  {field:'title',value:this.get_title_from_filename(this.#props.file_name)},
                  {field:'file_name',value:this.#props.file_name},
                  {field:'folder_path',value:this.#props.folder_path},
                  {field:'item_ref',value:'ASTM_ARCHIVE_'},     // to do : have configurable for default ref naming prepend..
                  {field:'img',value:`${this.#root_folder}\\${this.#props.folder_path}\\${this.#props.file_name}`,alt:this.get_title_from_filename(this.#props.file_name)}
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


   get_title_from_filename = (file_name) => {
      // to do : move to lib file
      let candidate = file_name.substring(0,file_name.length - 4).replaceAll('-',' ')
      candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1)             
      return candidate
   }
   

   // display if we have a valid img file
   // is_image_file queries main process if the file exists and also if the ext is img ext
   // to do : move to lib file - also in CollectionItemForm

   display_if_img_file = async (parent_elem,file_path,alt_text) => {

      let res = await is_image_file(file_path)  
      if(res) {
         let img = await build_img_elem('record_img',file_path,alt_text)
         if(img) {
            parent_elem.replaceChildren(create_div(),img)
         }
      }
      else {
         parent_elem.replaceChildren(create_div(),document.createTextNode('No image file was found.'))
      }
   }

}



export default CollectionItemInjectForm