import ActionsLogComponent from '../ActionsLogComponent/ActionsLogComponent.js'
import PageBanner from '../PageBanner/PageBanner.js'
import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_section,create_button } from '../../utilities/ui_elements.js'



class ImportCSVComponent {

   #csv_actions_log_component

   #context = {
      key:'ImportCSVComponent'
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
         classlist:['flex','flex_col','align_items_center','px_1']
      })   

      const page_banner = new PageBanner({
         icon_name:'csv',
         title:'CSV Files : Import',
         lead:'Comma-Separated-Value (CSV) files are a common file format for tranfering data between applications.'
      })
      import_csv_section.append(page_banner.render())

      const import_btn_panel = create_div({
         classlist:['flex','justify_center']
      })    
      let import_csv_btn = create_button({
         attributes:[{key:'id',value:'import_csv_btn'}],
         classlist:['action_btn'],
         text:'Import CSV File'
      })
      const warning = create_p({
         classlist:['mx_2','mt_0','mb_0','bg_yellow_100','p_1','pt_1.5','rounded_sm','w_50','text_italic','text_grey'],
         text:'You are recommended to backup the database before proceeding to ensure you can recover if any issues arise.'
      })  
      import_btn_panel.append(import_csv_btn,warning)

      const import_csv_outcome = create_div({
         attributes:[{key:'id',value:'import_csv_outcome'}],
         classlist:['mt_0.5']
      })
 
      import_csv_section.append(import_btn_panel,import_csv_outcome)

      
      const import_info_panel = create_div({
         classlist:['flex','border','rounded','bg_white','mt_1','mx_2','p_0.5','pb_1']
      })
      // display fields info
      const fields = create_div({
         classlist:['flex','gap_0']
      })
      const fields_intro = create_p({
         classlist:['m_0','mx_2','p_0.5','w_full'],
         text:'Any import CSV file must match the following fields list for each record:'
      })
      const fields_list_elem = create_div({
         classlist:['text_grey','border','rounded_sm','m_0','mx_2','p_0.5'],
         text:fields_list.join(', ')
      })
      const fields_desc = create_p({
         classlist:['m_0','mx_2','p_0.5','w_full'],
         text:`Empty fields are permitted but must be included. For example 'fishing,,harbour' would be valid.`
      })
      import_info_panel.append(fields_intro,fields_list_elem,fields_desc)

      const import_csv_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[{key:'id',value:'import_csv_fields'}]
      })
      const csv_history_section = create_div({
         attributes:[{key:'id',value:'csv_history_section'}],
         classlist:['mx_2']
      })
      
      this.#csv_actions_log_component = new ActionsLogComponent('import_csv','CSV Import History')
      if(this.#csv_actions_log_component) {
         csv_history_section.append(await this.#csv_actions_log_component.render('import_csv'))
         setTimeout(() => this.#csv_actions_log_component.activate(),200)
      }

      // assemble
      import_csv_section.append(import_info_panel,import_csv_fields,csv_history_section)
   
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
                  const dlg_props = {
                     title:'Importing CSV File',
                     file_name:file_path,
                     text:'Please wait while we process the import file'
                  }
                  const wait_dlg_component = new WaitDialog(dlg_props)
                  let import_csv_section = document.getElementById('import_csv_section')
                  if(import_csv_section) {
                     import_csv_section.append(wait_dlg_component.render())
                  }

                  // call import func in main process
                  const import_results_obj = await window.actions_api.importCSVFile(file_path)

                  if (typeof import_results_obj != "undefined") { 

                        // errors: [{
                        //    name: 'file_name',
                        //    message: 'This is not a valid filename.',
                        //    value: 'coffee mug'
                        // },
                        // {
                        //    name: 'item_date',
                        //    message: 'This value is not a valid date (YYYY-MM-DD)',
                        //    value: '\\Research_A-G\\bell-rock-lighthouse'
                        // }]

                     let failed_lines = []
                     if(import_results_obj.failed_lines) {
                        failed_lines = import_results_obj.failed_lines.map(failed_line => {
                           return `Line ${failed_line.line} : ${this.failed_line_error_ui(failed_line.errors)}`
                        })
                     }
                     
                     // prepend for Notification display
                     if(failed_lines.length > 0) failed_lines = ['First 10 invalid lines:',...failed_lines]

                     if(import_results_obj.outcome === 'success') {
                        wait_dlg_component.close()
                        await this.import_csv_completed()
                        Notification.notify(
                           '#import_csv_outcome',
                           [
                              `The import on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was completed successfully.`,
                              ...import_results_obj.message_arr,
                              ...failed_lines,
                           ],
                           ['bg_inform'],
                           false
                        )
                     }
                     else {
                        wait_dlg_component.close()
                        await this.import_csv_completed()
                        Notification.notify(
                           '#import_csv_outcome',
                           [
                              ...import_results_obj.message_arr,
                              ...failed_lines,
                           ],
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

   // name|message|value to string
   failed_line_error_ui = (errors) => {
      let str = ''
      errors.forEach(error => {
         str+= `  ${error['name'] ? '<' + error['name'] + '> ' : ''}
                  ${error['message'] ? error['message'] : ''}  
                  ${error['value'] ? '"' + error['value'] + '"    ' : '    '} `

      })
      return str
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

   get_default_context = () => {
      return this.#context
   }
}

export default ImportCSVComponent