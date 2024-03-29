import App from '../App/App.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import { create_section,create_h,create_div } from '../../utilities/ui_elements.js'



class AddCollectionItem {

   #record

   render = () => {
      
      this.#record = create_section({
         attributes:[
            {key:'id',value:'record'}
         ]
      })

      const add_item_heading = create_h({
         level:'h1',
         text:'Add a file to the collection',
         classlist:['m_0']
      })

      const item_form_wrap = create_section({
         attributes:[
            {key:'id',value:'item_form_wrap'}
         ],
         level:'h1'
      })

      // assemble
      this.build_form(item_form_wrap)
      this.#record.append(add_item_heading,item_form_wrap)
      
      return this.#record
   }


   build_form = async (item_form_wrap) => {

      try {
         const collection_item_obj = await window.collection_items_api.getCollectionItemFields()

         if (typeof collection_item_obj != "undefined") {

            // remove non-editable fields
            let create_required_fields = collection_item_obj.fields.filter((field) => {
               return field.editable
            })

            if(collection_item_obj.outcome === 'success') {

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


export default AddCollectionItem