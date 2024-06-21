import PageBanner from '../PageBanner/PageBanner.js'
import { get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { create_section,create_h,create_div,create_button } from '../../utilities/ui_elements.js'
import { extract_file_name } from '../../utilities/ui_strings.js'
import Notification from '../../components/Notification/Notification.js'



class ExportJSONComponent {

   #context = {
      key:'ExportJSONComponent'
   }


   render = () => {

      const export_json_section = create_section({
         attributes:[{key:'id',value:'export_json_section'}],
         classlist:['flex','flex_col','align_items_center','px_1']
      })
      const page_banner = new PageBanner({
         icon_name:'json',
         title:'JSON Files : Export',
         lead:`JavaScript Object Notation (JSON) files are a human-readable file format for tranfering data between applications.
               They are better suited for moving small sets of data where some manual manipulation is needed.`
      })
      const export_json_btn = create_button({
         attributes:[{key:'id',value:'export_json_btn'}],
         classlist:['action_btn','align_self_center'],
         text:'Export JSON File'
      })
      const export_json_outcome = create_div({
         attributes:[{key:'id',value:'export_json_outcome'}]
      }) 
      window.scroll(0,0)

      // assemble
      export_json_section.append(
         page_banner.render(),
         export_json_btn,
         export_json_outcome
      )
      return export_json_section
   }


   // enable buttons/links displayed in the render
   activate = async () => {

      // Export Folder and Export JSON File
      const export_json_btn = document.getElementById('export_json_btn')
      const export_json_section = document.getElementById('export_json_section')
      const export_json_outcome = document.getElementById('export_json_outcome')

      if(export_json_btn) {         
         export_json_btn.addEventListener('click', async(event) => {            
            event.preventDefault()
            
            // datestamp file
            const date_time_stamp = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
         
            const options = {
               defaultPath:`stc-export-${date_time_stamp}`,
               filters:[{ name: 'JSON', extensions: ['json'] },]
            }
            const result = await window.files_api.openSaveFileDlg(options)

            if(result != "undefined" && result.outcome === 'success') {
               try {                  
                  const file_name = extract_file_name(result.file_path)

                  const export_results_obj = await window.actions_api.exportJSONFile(file_name,result.file_path)  

                  if (typeof export_results_obj != "undefined" && export_results_obj.outcome === 'success') {
                     let folder_path_only = export_results_obj.file_path.replace(export_results_obj.file_name,'')
            
                     let export_json_folder_btn = create_button({
                        attributes:[
                           {key:'data-folder-path',value:folder_path_only},
                           {key:'id',value:'export_json_folder_btn'},
                        ],
                        classlist:['align_self_center'],
                        text:'Open Export Folder'
                     }) 
                     if(export_json_outcome) {
                        Notification.notify('#export_json_outcome',`The export was successful.`,['bg_inform'])
                     }
                     if(export_json_section) {
                        export_json_section.append(export_json_folder_btn)
                     }
                     setTimeout(() => this.activate_folder_btn(),200)                     
                  }
               }
               catch(error) {
                  Notification.notify('#export_json_outcome','There was an error attempting to export the records.' + error)
               }
            }
            else {
               Notification.notify('#export_json_outcome',result.message)
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
   
   get_default_context = () => {
      return this.#context
   }

}



export default ExportJSONComponent