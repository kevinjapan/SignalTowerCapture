import { app } from '../../../renderer.js'
import PageBanner from '../../PageBanner/PageBanner.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import { create_section } from '../../../utilities/ui_elements.js'



class AddCollectionItem {

   #record

   #context = {
      key:'AddCollectionItem'
   }

   render = () => {
      
      // Section Container
      this.#record = create_section({
         attributes:[{key:'id',value:'record'}],
         classlist:['mt_2']
      })      

      // PageBanner
      const page_banner = new PageBanner({
         icon_name:'card_text',
         title:'Add A New Record',
         lead:'Add a file to the system.'
      })

      // Form Container
      const item_form_wrap = create_section({
         attributes:[{key:'id',value:'item_form_wrap'}]
      })

      // Hydrate Form
      this.inject_form_into(item_form_wrap)

      // assemble
      this.#record.append(
         page_banner.render(),
         item_form_wrap
      )      
      return this.#record
   }


   inject_form_into = async (item_form_wrap) => {

      try {
         const collection_item_obj = await window.collection_items_api.getCollectionItemFields()

         if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {

            // remove non-editable fields
            let create_required_fields = collection_item_obj.fields.filter((field) => {
               return field.editable
            })
            
            // we display empty CollectionItemForm for data entry
            const collection_item_form = new CollectionItemForm({
               fields:create_required_fields,
               find_files:true,
               action:'add'
            })

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