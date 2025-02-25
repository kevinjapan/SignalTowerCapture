import ActionsLogComponent from '../components/ActionsLogComponent/ActionsLogComponent.js'
import PageBanner from '../components/PageBanner/PageBanner.js'
import WaitDialog from '../components/WaitDialog/WaitDialog.js'
import Notification from '../components/Notification/Notification.js'
import { get_ui_ready_date, get_ui_ready_time } from '../utilities/ui_datetime.js'
import { create_section,create_h,create_p,create_div,create_button } from '../utilities/ui_elements.js'



class ImportJSONView {

   #json_actions_log_component

   #context = {
      key:'ImportJSONView'
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
         classlist:['flex','flex_col','align_items_center','px_1']
      })

      const page_banner = new PageBanner({
         icon_name:'json',
         title:'JSON Files : Import',
         lead:`JavaScript Object Notation (JSON) files are a human-readable file format for tranfering data between applications.
               They are better suited for moving small sets of data where some manual manipulation is needed.`
      })
      
      const import_btn_panel = create_div({
         classlist:['flex','justify_center']
      })
      let import_json_btn = create_button({
         attributes:[{key:'id',value:'import_json_btn'}],
         classlist:['action_btn'],
         text:'Import JSON File'
      })
      const warning = create_p({
         classlist:['mx_2','mt_0','mb_0','bg_yellow_100','p_1','pt_1.5','rounded_sm','w_50','text_italic','text_grey'],
         text:'You are recommended to backup the database before proceeding to ensure you can recover if any issues arise.'
      })
      import_btn_panel.append(import_json_btn,warning)

      // display fields info
      const fields = create_div({
         classlist:['flex','gap_0']
      })
      
      const import_info_panel = create_div({
         classlist:['flex','border','rounded','bg_white','mt_1','mx_2','p_0.5','pb_1']
      })
      // required fields
      const fields_required = create_p({
         classlist:['m_0','mx_2','p_0.5','w_full'],
         text:'The following fields are the minimum required to create a record:'
      })
      const required_fields_elem = create_div({
         classlist:['text_grey','border','rounded_sm','m_0','mx_2','p_0.5'],
         text:required_json_fields.join(', ')
      })

      // full fields lists
      const fields_intro = create_p({
         classlist:['m_0','mx_2','p_0.5','w_full'],
         text:'The full list of available fields for a single record are:'
      })
      const fields_list_elem = create_div({
         classlist:['text_grey','border','rounded_sm','m_0','mx_2','p_0.5'],
         text:fields_list.join(', ')
      })

      const fields_desc = create_p({
         classlist:['mt_0','mb_0','w_100'],
         text:``
      })
      import_info_panel.append(fields_required,required_fields_elem,fields_intro,fields_list_elem,fields_desc)
      fields.append(import_info_panel)

      const import_json_outcome = create_div({
         attributes:[{key:'id',value:'import_json_outcome'}],
         classlist:['mt_0.5']
      })

      const import_json_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[{key:'id',value:'import_json_fields'}]
      })      
      const json_history_section = create_div({
         attributes:[{key:'id',value:'json_history_section'}],
         classlist:['mx_2']
      })
      const json_actions_log_component = new ActionsLogComponent('import_json','JSON Import History')
      if(json_actions_log_component) {
         json_history_section.append(await json_actions_log_component.render('import_json'))
         setTimeout(() => json_actions_log_component.activate(),200)
      }
      window.scroll(0,0)

      // assemble
      import_json_section.append(
         page_banner.render(),
         import_btn_panel,
         import_json_outcome,
         fields,import_json_fields,
         json_history_section
      )
   
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
               const dlg_props = {
                  title:'Importing JSON File',
                  file_name:file_path,
                  text:'Please wait while we process the import file'
               }
               const wait_dlg_component = new WaitDialog(dlg_props)
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

export default ImportJSONView