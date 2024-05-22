import { get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { create_section,create_h,create_p,create_div,create_button } from '../../utilities/ui_elements.js'
import { extract_file_name } from '../../utilities/ui_strings.js'
import Notification from '../../components/Notification/Notification.js'

import { icon } from '../../utilities/ui_utilities.js'



class ExportJSONComponent {
   
   render = () => {

      let export_json_section = create_section({
         attributes:[{key:'id',value:'json_section'}],
         classlist:['fade_in','bg_white','box_shadow','rounded','m_2','mt_2','mb_4','pb_2']
      })
      const json_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const json_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'JSON Files : Export'
      })
      json_header.append(icon('json'),json_section_h)
      const json_section_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:`JavaScript Object Notation (JSON) files are a human-readable file format for tranfering data between applications.
         They are better suited for moving small sets of data where some manual manipulation is needed.`
      })
      export_json_section.append(json_header,json_section_desc)

      const heading = create_h({
         level:'h4',
         text:'Export JSON File'
      })

      let export_json_btn = create_button({
         attributes:[{key:'id',value:'export_json_btn'}],
         classlist:['action_btn'],
         text:'Export JSON File'
      })  

      const export_json_outcome = create_div({
         attributes:[{key:'id',value:'export_json_outcome'}]
      })
 
      // assemble
      export_json_section.append(heading,export_json_btn,export_json_outcome)
      return export_json_section
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
               defaultPath:`signal-tower-capture-export-${date_time_stamp}`,
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
                        text:'Open Export Folder'
                     }) 
                     if(export_json_outcome) {
                        Notification.notify('#export_json_outcome',`The export was successful.`,['bg_inform'])
                        export_json_outcome.append(export_json_folder_btn)
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
}



export default ExportJSONComponent