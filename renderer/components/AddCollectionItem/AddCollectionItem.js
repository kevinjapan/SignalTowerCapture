import App from '../App/App.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import { create_section } from '../../utilities/ui_elements.js'



class AddCollectionItem {

   #record

   render = () => {
      
      this.#record = create_section({
         attributes:[{key:'id',value:'record'}],
         classlist:['mt_2']
      })

      const item_form_wrap = create_section({
         attributes:[{key:'id',value:'item_form_wrap'}],
         level:'h1'
      })

      // assemble
      this.build_form(item_form_wrap)
      this.#record.append(item_form_wrap)
      
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
         App.switch_to_component('Error',{
            msg:'Sorry, we were unable to access the Records.',
            error:error
         })
      }
   }

   // enable buttons/links displayed in the render
   activate = () => {}

}


export default AddCollectionItem