import ActionsLogComponent from '../ActionsLogComponent/ActionsLogComponent.js'
import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_section,create_button } from '../../utilities/ui_elements.js'
import { icon } from '../../utilities/ui_utilities.js'



class ImportCSVComponent {

   #completed_callback  // to do : remove this

   #csv_actions_log_component
   
   constructor(completed_callback) {
      this.#completed_callback = completed_callback  
   }

   render = async() => {
      
      // required csv fields
      let fields_list = []
      const collection_item_obj = await window.collection_items_api.getCollectionItemFields()
      if(typeof collection_item_obj !== undefined && collection_item_obj.outcome === 'success') {
         if(Array.isArray(collection_item_obj.fields)) {
            fields_list = collection_item_obj.fields.map((field) => {
               return field.key
            })
         }
      }

      // layout
      let import_csv_section = create_section({
         attributes:[{key:'id',value:'import_csv_section'}],
         classlist:['fade_in','bg_white','box_shadow','rounded','m_2','mt_2','mb_4','pb_2']
      })   
      const csv_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const import_csv_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'CSV Files : Import'
      })
      csv_header.append(icon('csv'),import_csv_section_h)
      const csv_section_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:'Comma-Separated-Value (CSV) files are a common file format for tranfering data between applications.'
      })

      const action_section = create_section({
         classlist:['flex','align_items_center','no_wrap']
      })
      const warning = create_p({
         classlist:['mt_0','mb_0','bg_yellow_200','p_1','rounded','w_50'],
         text:'You are recommended to backup the database before any import actions to ensure you can recover if any issues arise.'
      })      
      let import_csv_btn = create_button({
         attributes:[{key:'id',value:'import_csv_btn'}],
         classlist:['action_btn'],
         text:'Import CSV File'
      })  
      action_section.append(import_csv_btn,warning)

      const import_csv_outcome = create_div({
         attributes:[{key:'id',value:'import_csv_outcome'}]
      })
      import_csv_section.append(csv_header,csv_section_desc,action_section,import_csv_outcome)

      // display fields info
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
   
      const heading = create_h({
         level:'h4',
         text:'Fields'
      })

      const import_csv_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[{key:'id',value:'import_csv_fields'}]
      })
      const csv_history_section = create_div({
         attributes:[{key:'id',value:'csv_history_section'}]
      })
      
      this.#csv_actions_log_component = new ActionsLogComponent('import_csv','CSV Import History')
      if(this.#csv_actions_log_component) {
         csv_history_section.append(await this.#csv_actions_log_component.render('import_csv'))
         setTimeout(() => this.#csv_actions_log_component.activate(),200)
      }

      // assemble
      import_csv_section.append(heading,fields,import_csv_fields,csv_history_section)
   
      return import_csv_section
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
                  let import_csv_section = document.getElementById('import_csv_section')
                  if(import_csv_section) {
                     import_csv_section.append(wait_dlg_component.render())
                  }

                  // call import func in main process
                  const import_results_obj = await window.actions_api.importCSVFile(file_path)

                  console.log('import_results_obj',import_results_obj)

                  if (typeof import_results_obj != "undefined") { 
                     if(import_results_obj.outcome === 'success') {
                        wait_dlg_component.close()
                        await this.import_csv_completed()
                        Notification.notify(
                           '#import_csv_outcome',
                           [`The import on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.`,...import_results_obj.message_arr],
                           ['bg_inform'],
                           false
                        )
                     }
                     else {
                        wait_dlg_component.close()
                        await this.import_csv_completed()
                        Notification.notify(
                           '#import_csv_outcome',
                           import_results_obj.message_arr,
                           [],
                           false
                        )
                     }
                  }
               }
               else {
                  Notification.notify('#import_csv_outcome',result.message_arr)
                  await this.import_csv_completed()
               }
            })
         }
   }

   close_wait_dlg = (parent_section) => {
      let wait_dlg = document.getElementById('wait_dlg')
      if(wait_dlg) parent_section.removeChild(wait_dlg)
   }

   //
   // Logs history - we refresh regardless of outcome
   //
   import_csv_completed = async() => {
      const csv_history_section = document.getElementById('csv_history_section')
      if(csv_history_section) {
         // delay to prevent getting ahead of changes 
         setTimeout(async() => {
            csv_history_section.replaceChildren(await this.#csv_actions_log_component.render('import_csv'))
            this.#csv_actions_log_component.extend_list()
            setTimeout(() => this.#csv_actions_log_component.activate(),200)
         },500)
      }
   }

}

export default ImportCSVComponent