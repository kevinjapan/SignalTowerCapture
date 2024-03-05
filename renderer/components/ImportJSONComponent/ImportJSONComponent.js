import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
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
         level:'h3',
         text:'Import JSON File'
      })

      const paragraph = create_p({
         text:'Select destination folder.'
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
         ],
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1']
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

      const import_json_btn = document.getElementById('import_json_btn')

      if(import_json_btn) {

            import_json_btn.addEventListener('click', async(event) => {

               event.preventDefault()

               Notification.notify('#import_json_outcome','')

               const options = {
                  filters:[{name:'JSON',extensions:['json']},]
               }
       
               // user select file dialog
               const result = await window.files_api.getFilePath(options)

               if(result.outcome === 'success') {

                  let file_path = result.files[0]

                  // open 'please wait..' msg dlg
                  const wait_dlg_component = new WaitDialog()
                  let actions_section = document.getElementById('actions_section')
                  if(actions_section) {
                     actions_section.append(wait_dlg_component.render())
                  }

                  const import_results_obj = await window.actions_api.importJSONFile(file_path)  

                  if (typeof import_results_obj != "undefined") { 

                     if(import_results_obj.outcome === 'success') {
                        this.close_wait_dlg(actions_section)
                        Notification.notify('#import_json_outcome',`The import on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.`)
                     }
                     else {
                        this.close_wait_dlg(actions_section)
                        Notification.notify('#import_json_outcome',import_results_obj.message)
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


}



export default ImportJSONComponent