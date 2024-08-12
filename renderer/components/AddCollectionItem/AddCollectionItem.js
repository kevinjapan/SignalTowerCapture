import { app } from '../../renderer.js'
import PageBanner from '../PageBanner/PageBanner.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import { create_section } from '../../utilities/ui_elements.js'



class AddCollectionItem {

   #record

   #context = {
      key:'AddCollectionItem'
   }

   render = () => {
      
      this.#record = create_section({
         attributes:[{key:'id',value:'record'}],
         classlist:['mt_2']
      })      
      const page_banner = new PageBanner({
         icon_name:'card_text',
         title:'Add A New Record',
         lead:'Add a file to the system.'
      })
      const item_form_wrap = create_section({
         attributes:[{key:'id',value:'item_form_wrap'}],
         level:'h1'
      })

      // assemble
      this.build_form(
         item_form_wrap
      )
      this.#record.append(
         page_banner.render(),
         item_form_wrap
      )      
      return this.#record
   }


   build_form = async (item_form_wrap) => {

      try {
         const collection_item_obj = await window.collection_items_api.getCollectionItemFields()

         if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {

            // remove non-editable fields
            let create_required_fields = collection_item_obj.fields.filter((field) => {
               return field.editable
            })
            let props = {
               fields:create_required_fields,
               find_files:true,
               action:'add'
            }
            
            // display empty CollectionItemForm for data entry
            const collection_item_form = new CollectionItemForm(props)
            item_form_wrap.appendChild(await collection_item_form.render())
            collection_item_form.activate()
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
   activate = () => {}

   get_default_context = () => {
      return this.#context
   }
}


export default AddCollectionItem