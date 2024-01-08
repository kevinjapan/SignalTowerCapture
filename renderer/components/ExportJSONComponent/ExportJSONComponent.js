import { get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { create_h,create_div,create_button } from '../../utilities/ui_elements.js'
import { extract_file_name } from '../../utilities/ui_strings.js'
import Notification from '../../components/Notification/Notification.js'




class ExportJSONComponent {
   
   render = () => {

      const export_json_component = create_div({
         attributes:[
            {key:'id',value:'export_json_component'}
         ],
         classlist:['ui_component']
      })
   
      const heading = create_h({
         level:'h3',
         text:'Export JSON File'
      })

      let export_json_btn = create_button({
         attributes:[
            {key:'id',value:'export_json_btn'}
         ],
         text:'Export JSON File'
      })  

      const export_json_outcome = create_div({
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'export_json_outcome'}
         ]
      })


      
      // assemble
      export_json_component.append(heading,export_json_btn,export_json_outcome)
      return export_json_component
   }


   // enable buttons/links displayed in the render
   activate = async () => {

      // Export Folder and Export JSON File
      const export_json_btn = document.getElementById('export_json_btn')
      const export_json_outcome = document.getElementById('export_json_outcome')

      if(export_json_btn) {
         
            export_json_btn.addEventListener('click', async(event) => {
               
               event.preventDefault()
               
               // datestamp file
               const date_time_stamp = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
            
               const options = {
                  defaultPath:`signal-capture-export-${date_time_stamp}`,
                  filters:[{ name: 'JSON', extensions: ['json'] },]
               }

               const result = await window.files_api.saveFile(options)

               if(result.outcome === 'success') {
                  try {
                     
                     const file_name = extract_file_name(result.file_path)

                     const export_results_obj = await window.actions_api.exportJSONFile(file_name,result.file_path)  

                     if (typeof export_results_obj != "undefined") { 

                        if(export_results_obj.outcome === 'success') {

                           let folder_path_only = export_results_obj.file_path.replace(export_results_obj.file_name,'')
                  
                           let export_json_folder_btn = create_button({
                              attributes:[
                                 {key:'data-folder-path',value:folder_path_only},
                                 {key:'id',value:'export_json_folder_btn'},
                              ],
                              text:'Open Export Folder'
                           }) 
                           if(export_json_outcome) {
                              Notification.notify('export_json_outcome',`The export was successful.`)
                              export_json_outcome.append(export_json_folder_btn)
                           }
                           setTimeout(() => this.activate_folder_btn(),200)
                        }
                        else {
                           Notification.notify('export_json_outcome',export_results_obj.message)
                        }
                     }
                  }
                  catch(error) {
                     Notification.notify('export_json_outcome','There was an error attempting to export the records.' + error)
                  }
               }
               else {
                  Notification.notify('export_json_outcome',result.message)
               }
            })
         }
   }

   activate_folder_btn = () => {

      // Open the export folder user selected
      const export_json_folder_btn = document.getElementById('export_json_folder_btn')
      if(export_json_folder_btn) {
         export_json_folder_btn.addEventListener('click', async() => {
            const folder_path = export_json_folder_btn.getAttribute('data-folder-path')
            await window.files_api.openFolder(folder_path)
         })
      }

   }

}



export default ExportJSONComponent