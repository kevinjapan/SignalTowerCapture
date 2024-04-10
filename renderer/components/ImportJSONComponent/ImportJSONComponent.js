import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import { get_ui_ready_date,get_ui_ready_time,get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_section,create_button } from '../../utilities/ui_elements.js'




class ImportJSONComponent {

   render = () => {

      const import_json_component = create_section({
         attributes:[
            {key:'id',value:'import_json_component'}
         ],
         classlist:['ui_component','h_100']
      })
   
      const heading = create_h({
         level:'h4',
         text:'Import JSON File'
      })

      const paragraph = create_p({
         text:'Select folder.'
      }) 

      let import_json_btn = create_button({
         attributes:[
            {key:'id',value:'import_json_btn'}
         ],
         text:'Import JSON File'
      })  

      const import_json_outcome = create_div({
         attributes:[
            {key:'id',value:'import_json_outcome'}
         ]
      })

      const import_json_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'import_json_fields'}
         ]
      })

      // assemble
      import_json_component.append(heading,paragraph,import_json_btn,import_json_outcome,import_json_fields)
   
      return import_json_component
   }


   // enable buttons/links displayed in the render
   activate = async () => {

      //
      // Import a json file
      //
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

               // time execution
               const start_timer_at = Math.ceil(performance.now())

               // date/time strings for log
               const import_start_at = get_sqlready_datetime()

               let file_path = result.files[0]

               const file_size = await window.files_api.getFileSize(file_path)
               const file_kb_size = file_size.file_kb_size
               const est_secs_duration = (file_kb_size / 100) * this.get_secs_per_kb(file_kb_size)

               // open 'please wait..' dlg
               const wait_dlg_component = new WaitDialog({file_name:file_path,est_secs_duration:est_secs_duration})
               let actions_section = document.getElementById('actions_section')
               if(actions_section) {
                  actions_section.append(wait_dlg_component.render())
               }

               // call import func in main process
               const import_results_obj = await window.actions_api.importJSONFile(file_path)

               const end_timer_at = Math.ceil(performance.now())
               const import_end_at = get_sqlready_datetime()

               // to do : utilize these times!
               console.log('time taken:',end_timer_at - start_timer_at,'milliseconds')
               console.log('import times logged as:',import_start_at,import_end_at)

               if (typeof import_results_obj != "undefined") { 

                  if(import_results_obj.outcome === 'success') {
                     wait_dlg_component.close()
                     Notification.notify(
                        '#import_json_outcome',
                        `The import on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.`,
                        ['bg_inform']
                     )
                  }
                  else {
                     // this.close_wait_dlg(actions_section)
                     wait_dlg_component.close()
                     Notification.notify('#import_json_outcome',import_results_obj.message,[],false)
                  }
               }
            }
            else {
               Notification.notify('#import_json_outcome',result.message)
            }
         })
      }
   }

   close_wait_dlg = (parent_section) => {
      let wait_dlg = document.getElementById('wait_dlg')
      if(wait_dlg) parent_section.removeChild(wait_dlg)
   }

   
   //
   // estimated processing times
   // very rough - we rely on 'finishing' text to smooth ending!
   // note that these estimates are for the typical import scenario
   // of complete records w/ all fields present
   // importing records w/ only eg 2 or 3 fields will under-estimate 
   // and fill the progress bar early - but rare scenario and non-breaking
   //
   get_secs_per_kb = (file_kb_size) => {
      if(file_kb_size > 800) return 80
      if(file_kb_size > 600) return 60
      if(file_kb_size > 300) return 50
      return 35
   }
}

export default ImportJSONComponent