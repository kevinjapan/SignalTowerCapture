import ActionsLogComponent from '../ActionsLogComponent/ActionsLogComponent.js'
import PageBanner from '../PageBanner/PageBanner.js'
import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_section,create_h,create_p,create_div,create_button } from '../../utilities/ui_elements.js'



class ImportJSONComponent {

   #json_actions_log_component

   #context = {
      key:'ImportJSONComponent'
   }

   
   render = async() => { 

      // required json fields
      let fields_list = []
      let required_json_fields = []
      const collection_item_obj = await window.collection_items_api.getCollectionItemFields()
      if(typeof collection_item_obj !== undefined && collection_item_obj.outcome === 'success') {
         if(Array.isArray(collection_item_obj.fields)) {
            fields_list = collection_item_obj.fields.map((field) => {
               return field.key
            })
            required_json_fields = collection_item_obj.fields.filter((field) => {
               return field.required_json === true
            }).map(field => field.key)
         }
      }

      let import_json_section = create_section({
         attributes:[{key:'id',value:'import_json_section'}],
         classlist:['px_1']
      })

      const page_banner = new PageBanner({
         icon_name:'json',
         title:'JSON Files : Import',
         lead:`JavaScript Object Notation (JSON) files are a human-readable file format for tranfering data between applications.
               They are better suited for moving small sets of data where some manual manipulation is needed.`
      })
      import_json_section.append(page_banner.render())

      const action_section = create_section({
         classlist:['flex','align_items_center','no_wrap']
      })
      const warning = create_p({
         classlist:['mt_0','mb_0','bg_yellow_200','p_1','rounded','w_50'],
         text:'You are recommended to backup the database before any import actions to ensure you can recover if any issues arise.'
      })      
      let import_json_btn = create_button({
         attributes:[{key:'id',value:'import_json_btn'}],
         classlist:['action_btn'],
         text:'Import JSON File'
      })  
      action_section.append(import_json_btn,warning)

      // display fields info
      const fields = create_div({
         classlist:['flex']
      })
      const fields_intro = create_p({
         classlist:['mt_0','mb_0'],
         text:'The full list of available fields for a single record:'
      })
      const fields_list_elem = create_div({
         classlist:['text_grey','border','rounded','p_1','m_0.5','mt_0','w_100'],
         text:fields_list.join(', ')
      })
      const fields_required = create_p({
         classlist:['mt_0','mb_0','w_100'],
         text:'The following fields are the minimum required to create a record:'
      })
      const required_fields_elem = create_div({
         classlist:['text_grey','border','rounded','p_1','m_0.5','mt_0','w_100'],
         text:required_json_fields.join(', ')
      })
      const fields_desc = create_p({
         classlist:['mt_0','mb_0','w_100'],
         text:``
      })
      fields.append(fields_required,required_fields_elem,fields_intro,fields_list_elem,fields_desc)

      const heading = create_h({
         level:'h4',
         text:'Fields'
      })
      const import_json_outcome = create_div({
         attributes:[{key:'id',value:'import_json_outcome'}]
      })

      const import_json_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[{key:'id',value:'import_json_fields'}]
      })      
      const json_history_section = create_div({
         attributes:[
            {key:'id',value:'json_history_section'}
         ]
      })
      const json_actions_log_component = new ActionsLogComponent('import_json','JSON Import History')
      if(json_actions_log_component) {
         json_history_section.append(await json_actions_log_component.render('import_json'))
         setTimeout(() => json_actions_log_component.activate(),200)
      }

      // assemble
      import_json_section.append(action_section,import_json_outcome,heading,fields,import_json_fields,json_history_section)
   
      return import_json_section
   }


   // enable buttons/links displayed in the render
   activate = async () => {

      // Import a json file
      const import_json_btn = document.getElementById('import_json_btn')
      if(import_json_btn) {

         import_json_btn.addEventListener('click', async(event) => {

            event.preventDefault()
            Notification.notify('#import_json_outcome','')

            const options = {
               filters:[{name:'JSON',extensions:['json']},]
            }
      
            // activate 'select file' dialog for user input
            const result = await window.files_api.getFilePath(options)

            if(result.outcome === 'success') {

               let file_path = result.files[0]

               // open 'please wait..' dlg
               const wait_dlg_component = new WaitDialog({file_name:file_path})
               let import_json_section = document.getElementById('import_json_section')
               if(import_json_section) import_json_section.append(wait_dlg_component.render())

               // call import func in main process
               const import_results_obj = await window.actions_api.importJSONFile(file_path)
               
               if (typeof import_results_obj != "undefined") { 
                  if(import_results_obj.outcome === 'success') {
                     wait_dlg_component.close()
                     await this.import_json_completed()
                     Notification.notify(
                        '#import_json_outcome',
                        [`The import on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was completed successfully.`,...import_results_obj.message_arr],
                        ['bg_inform'],
                        false
                     )
                  }
                  else {
                     wait_dlg_component.close()
                     await this.import_json_completed
                     Notification.notify(
                        '#import_json_outcome',
                        import_results_obj.message_arr,
                        [],
                        false)                     
                  }
               }
            }
            else {
               Notification.notify('#import_json_outcome',result.message)
               await this.import_json_completed
            }
         })
      }
   }

   close_wait_dlg = (parent_section) => {
      let wait_dlg = document.getElementById('wait_dlg')
      if(wait_dlg) parent_section.removeChild(wait_dlg)
   }

   // history log - we refresh regardless of outcome
   import_json_completed = async() => {
      const json_history_section = document.getElementById('json_history_section')
      if(json_history_section && this.#json_actions_log_component) {
         // delay to prevent getting ahead of changes 
         setTimeout(async() => {
            json_history_section.replaceChildren(await this.#json_actions_log_component.render('import_json'))
            this.#json_actions_log_component.extend_list()
            setTimeout(() => this.#json_actions_log_component.activate(),200)
         },500)
      }
   }
   
   get_default_context = () => {
      return this.#context
   }
}

export default ImportJSONComponent