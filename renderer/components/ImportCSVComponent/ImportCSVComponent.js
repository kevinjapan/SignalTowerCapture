import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_section,create_button } from '../../utilities/ui_elements.js'



class ImportCSVComponent {

   #completed_callback

   
   constructor(completed_callback) {
      this.#completed_callback = completed_callback  
   }

   render = () => {

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
      import_csv_component.append(heading,import_csv_btn,import_csv_outcome,import_csv_fields)
   
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
                        Notification.notify('#import_csv_outcome',import_results_obj.message_arr,[],false)
                        console.log('one',import_results_obj)  // to do : bug - error caught but not notified
                                                               //         \collection-dataset\Research_H-L.txt
                        await this.#completed_callback()
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