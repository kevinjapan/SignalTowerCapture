import { create_section,create_h,create_div,create_button,create_p } from '../../utilities/ui_elements.js'
import { get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { extract_file_name } from '../../utilities/ui_strings.js'
import Notification from '../../components/Notification/Notification.js'
import { icon } from '../../utilities/ui_utilities.js'



class ExportCSVComponent {
   
   render = () => {

      let export_csv_section = create_section({
         attributes:[{key:'id',value:'export_csv_section'}],
         classlist:['fade_in','bg_white','box_shadow','rounded','m_2','mt_2','mb_4','pb_2']
      })   
      const csv_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const csv_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'CSV Files : Export'
      })
      csv_header.append(icon('csv'),csv_section_h)
      const csv_section_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:'Comma-Separated-Value (CSV) files are a common file format for tranfering data between applications.'
      })
      export_csv_section.append(csv_header,csv_section_desc)

      const heading = create_h({
         level:'h4',
         text:'Export CSV File'
      })

      let export_csv_btn = create_button({
         attributes:[{key:'id',value:'export_csv_btn'}],
         text:'Export CSV File'
      })  

      const export_csv_outcome = create_div({
         attributes:[{key:'id',value:'export_csv_outcome'}]
      })

      const export_csv_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[{key:'id',value:'export_csv_fields'}]
      })
      
      // assemble
      export_csv_section.append(heading,export_csv_btn,export_csv_fields)
      
      return export_csv_section
   }


   // enable buttons/links displayed in the render
   activate = async () => {

      // Export Folder and Export CSV File
      const export_csv_btn = document.getElementById('export_csv_btn')
      const export_csv_outcome = document.getElementById('export_csv_outcome')

      if(export_csv_btn) {
         export_csv_btn.addEventListener('click', async(event) => {
            event.preventDefault()   

            // datestamp file
            const date_time_stamp = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
         
            const options = {
               defaultPath:`signal-tower-capture-export-${date_time_stamp}`,
               filters:[{ name: 'CSV', extensions: ['txt'] },]
            }            
            const result = await window.files_api.openSaveFileDlg(options)

            if(result.outcome === 'success') {
               try {
                  const file_name = extract_file_name(result.file_path)
                        
                  const export_results_obj = await window.actions_api.exportCSVFile(file_name,result.file_path)  

                  if (typeof export_results_obj != "undefined" && export_results_obj.outcome === 'success') {
                     let folder_path_only = export_results_obj.file_path.replace(export_results_obj.file_name,'')
            
                     let export_csv_folder_btn = create_button({
                        attributes:[
                           {key:'data-folder-path',value:folder_path_only},
                           {key:'id',value:'export_csv_folder_btn'},
                        ],
                        text:'Open Export Folder'
                     }) 
                     if(export_csv_outcome) {
                        Notification.notify('#export_csv_outcome','The export was successful.',['bg_inform'])
                        export_csv_outcome.append(export_csv_folder_btn)
                     }

                     setTimeout(() => this.activate_folder_btn(),200)

                     // display fields in csv
                     const fields_obj = await window.collection_items_api.getCollectionItemFields()
                     
                     if (typeof fields_obj != "undefined" && fields_obj.outcome === 'success') {

                        if(Array.isArray(fields_obj.fields)) {
                           const field_keys = fields_obj.fields.map(field => {
                              return field.key
                           })
                           let export_csv_fields = document.getElementById('export_csv_fields')
                           if(export_csv_fields) {
                              export_csv_fields.innerText = 'The ordered fields are:\n' + field_keys.toString().replaceAll(',',', ')
                           }
                        }
                     }
                  }
               }
               catch(error) {
                  Notification.notify('#export_csv_outcome','There was an error attempting to export the records.' + error)
               }
            }
            else {
               Notification.notify('#export_csv_outcome',result.message)
            }
         })
      }
   }

   activate_folder_btn = () => {

      // Open the export folder user selected
      const export_csv_folder_btn = document.getElementById('export_csv_folder_btn')
      if(export_csv_folder_btn) {
         export_csv_folder_btn.addEventListener('click', async() => {
            const folder_path = export_csv_folder_btn.getAttribute('data-folder-path')
            await window.files_api.openFolder(folder_path)
         })
      }
   }
}


export default ExportCSVComponent