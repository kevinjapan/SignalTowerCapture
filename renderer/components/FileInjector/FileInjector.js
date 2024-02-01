import { create_section,create_h, create_p,create_div } from '../../utilities/ui_elements.js'
import Notification from '../../components/Notification/Notification.js'
import CollectionItemCard from '../CollectionItemCard/CollectionItemCard.js'
import CollectionItemInjectForm from '../CollectionItemInjectForm/CollectionItemInjectForm.js'


class FileInjector {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      
      let file_injector = create_section()

      const heading = create_h({
         level:'h3',
         text:'File Injector'
      })

      // check if the file matches an existing record
      const matching_record = this.#props.find_matching_record(this.#props.file_name)
      const record_fields = this.#props.get_record_fields()
      
      if(matching_record) {
         
         // a matching record for this file was found

         console.log('context',this.#props.context)

         let props = {context: this.#props.context}
         
         const check_outcome = create_div({
            classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
            attributes:[
               {key:'id',value:'export_csv_outcome'}
            ],
            text:`There is already a record for this file.`
         })

         Notification.notify('check_outcome',`2`)
         // assemble
         file_injector.append(heading,check_outcome)
         const collection_item_card = new CollectionItemCard(props)        
         file_injector.appendChild(collection_item_card.render(record_fields,matching_record))

         // to do : do we want to access full record in here - or just view only
         //         if we do grant access, need a 'back' mechanism / otherwise, 
         //          currently, best option, remove links from card (view here only)
         setTimeout(() => collection_item_card.activate(),200)
         
         


      }
      else {
         
         // no matching record was found for this file

         
         const check_outcome = create_div({
            classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
            attributes:[
               {key:'id',value:'export_csv_outcome'}
            ],
            text:'No matching record was found, proceed to add a new record'
         })
         const file = create_p({
            text:this.#props.file
         })
   
         // assemble
         file_injector.append(heading,check_outcome,file)
         const props = {}
         const inject_form = new CollectionItemInjectForm(props)
         file_injector.appendChild(inject_form.render())

      }
                  
         return file_injector



   }


   // enable buttons/links displayed in the render
   activate = () => {

   }

}



export default FileInjector