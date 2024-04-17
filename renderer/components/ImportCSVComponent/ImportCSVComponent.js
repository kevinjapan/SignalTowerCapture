import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_section,create_button } from '../../utilities/ui_elements.js'



class ImportCSVComponent {

   #completed_callback

   
   constructor(completed_callback) {
      this.#completed_callback = completed_callback  
   }

   render = async() => {
      
      // required csv fields
      //
      let fields_list = []
      const collection_item_obj = await window.collection_items_api.getCollectionItemFields()
      console.log('collection_item_obj',collection_item_obj)
      if(typeof collection_item_obj !== undefined) {
         if(collection_item_obj.outcome === 'success')
         fields_list = collection_item_obj.fields.map((field) => {
            return field.key
         })
      }
      const fields = create_div({
         classlist:['flex']
      })
      const fields_intro = create_p({
         classlist:['mt_0','mb_0'],
         text:'Any import CSV file must match the following fields list for each record:'
      })
      const fields_list_elem = create_div({
         classlist:['text_grey','border','rounded','p_1','m_0.5','mt_0'],
         text:fields_list.join(', ')
      })
      const fields_desc = create_p({
         classlist:['mt_0','mb_0'],
         text:`Empty fields are permitted but must be included. For example 'fishing,,harbour' would be a valid 3-field csv list with an empty middle field.`
      })
      fields.append(fields_intro,fields_list_elem,fields_desc)


      // layout
      //
      const import_csv_component = create_section({
         attributes:[
            {key:'id',value:'import_csv_component'}
         ],
         classlist:['ui_component','h_100']
      })
   
      const heading = create_h({
         level:'h4',
         text:'Import CSV File'
      })

      let import_csv_btn = create_button({
         attributes:[
            {key:'id',value:'import_csv_btn'}
         ],
         text:'Import CSV File'
      })  

      const import_csv_outcome = create_div({
         attributes:[
            {key:'id',value:'import_csv_outcome'}
         ]
      })

      const import_csv_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'import_csv_fields'}
         ]
      })

      // assemble
      import_csv_component.append(heading,fields,import_csv_btn,import_csv_outcome,import_csv_fields)
   
      return import_csv_component
   }


   // enable buttons/links displayed in the render
   activate = async () => {

      //
      // Import a csv file
      //
      const import_csv_btn = document.getElementById('import_csv_btn')
      if(import_csv_btn) {

            import_csv_btn.addEventListener('click', async(event) => {

               event.preventDefault()
               Notification.notify('#import_csv_outcome','')

               const options = {
                  filters:[{name:'TXT',extensions:['txt']},]
               }
       
            // activate 'select file' dialog for user input
               const result = await window.files_api.getFilePath(options)

               if(result.outcome === 'success') {

                  let file_path = result.files[0]

                  // open 'please wait..' dlg
                  const wait_dlg_component = new WaitDialog({file_name:file_path})
                  let actions_section = document.getElementById('actions_section')
                  if(actions_section) {
                     actions_section.append(wait_dlg_component.render())
                  }

                  // call import func in main process
                  const import_results_obj = await window.actions_api.importCSVFile(file_path)  

                  if (typeof import_results_obj != "undefined") { 

                     if(import_results_obj.outcome === 'success') {
                        wait_dlg_component.close()
                        await this.#completed_callback()
                        Notification.notify(
                           '#import_csv_outcome',
                           `The import on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.`,
                           ['bg_inform'])
                     }
                     else {
                        wait_dlg_component.close()
                        await this.#completed_callback()
                        Notification.notify('#import_csv_outcome',import_results_obj.message_arr,[],false)
                     }
                  }
               }
               else {
                  Notification.notify('#import_csv_outcome',result.message_arr)
                  await this.#completed_callback()
               }
            })
         }
   }

   close_wait_dlg = (parent_section) => {
      let wait_dlg = document.getElementById('wait_dlg')
      if(wait_dlg) parent_section.removeChild(wait_dlg)
   }

}

export default ImportCSVComponent