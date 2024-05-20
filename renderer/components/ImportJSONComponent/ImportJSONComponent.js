import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import { get_ui_ready_date,get_ui_ready_time,get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_section,create_button } from '../../utilities/ui_elements.js'



class ImportJSONComponent {

   #completed_callback

   
   constructor(completed_callback) {
      this.#completed_callback = completed_callback  
   }

   render = () => { 

      const import_json_component = create_section({
         attributes:[{key:'id',value:'import_json_component'}],
         classlist:['ui_component','h_100']
      })
   
      const heading = create_h({
         level:'h4',
         text:'Import JSON File'
      })
      const fields_pre_warning = create_p({
         classlist:['mt_0','mb_0','bg_yellow_200','p_1','rounded'],
         text:'You are recommended to backup the database before any import actions to ensure you can recover if any issues arise.'
      })

      let import_json_btn = create_button({
         attributes:[{key:'id',value:'import_json_btn'}],
         text:'Import JSON File'
      })  

      const import_json_outcome = create_div({
         attributes:[{key:'id',value:'import_json_outcome'}]
      })

      const import_json_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[{key:'id',value:'import_json_fields'}]
      })

      // assemble
      import_json_component.append(heading,fields_pre_warning,import_json_btn,import_json_outcome,import_json_fields)
   
      return import_json_component
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
               let actions_section = document.getElementById('actions_section')
               if(actions_section) {
                  actions_section.append(wait_dlg_component.render())
               }

               // call import func in main process
               const import_results_obj = await window.actions_api.importJSONFile(file_path)
               
               if (typeof import_results_obj != "undefined") { 


                  if(import_results_obj.outcome === 'success') {
                     wait_dlg_component.close()
                     await this.#completed_callback()
                     Notification.notify(
                        '#import_json_outcome',
                        `The import on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.`,
                        ['bg_inform']
                     )
                  }
                  else {
                     wait_dlg_component.close()
                     Notification.notify('#import_json_outcome',import_results_obj.message,[],false)
                     await this.#completed_callback()
                  }
               }
            }
            else {
               Notification.notify('#import_json_outcome',result.message)
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

export default ImportJSONComponent