import { create_h,create_div,create_button } from '../../utilities/ui_elements.js'
import { get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { extract_file_name } from '../../utilities/ui_strings.js'




class ExportCSVComponent {
   
   render = () => {

      const export_csv_component = create_div({
         attributes:[
            {key:'id',value:'export_csv_component'}
         ],
         classlist:['ui_component']
      })
   
      const heading = create_h({
         level:'h3',
         text:'Export CSV File'
      })

      let export_csv_btn = create_button({
         attributes:[
            {key:'id',value:'export_csv_btn'}
         ],
         text:'Export CSV File'
      })  

      const export_csv_outcome = create_div({
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'export_csv_outcome'}
         ]
      })

      // to do : display these..
      const export_csv_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'export_csv_fields'}
         ]
      })
      
      // assemble
      export_csv_component.append(heading,export_csv_btn,export_csv_outcome,export_csv_fields)
      
      setTimeout(() => this.activate(),200)
      return export_csv_component
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
                  defaultPath:`signal-capture-export-${date_time_stamp}`,
                  filters:[{ name: 'CSV', extensions: ['txt'] },]
               }
               
               const result = await window.files_api.saveFile(options)

               console.log('result',result)

               if(result.outcome === 'success') {
                  try {

                     const file_name = extract_file_name(result.file_path)
                           
                     const export_results_obj = await window.config_api.exportCSVFile(file_name,result.file_path)  

                     if (typeof export_results_obj != "undefined") { 

                        if(export_results_obj.outcome === 'success') {
                           
                           let folder_path_only = export_results_obj.file_path.replace(export_results_obj.file_name,'')
                  
                           let export_csv_folder_btn = create_button({
                              attributes:[
                                 {key:'data-folder-path',value:folder_path_only},
                                 {key:'id',value:'export_csv_folder_btn'},
                              ],
                              text:'Open Export Folder'
                           }) 
                           if(export_csv_outcome) {
                              export_csv_outcome.replaceChildren('The export was successful.')
                              export_csv_outcome.append(export_csv_folder_btn)
                           }
                           // to do : this.activate_folder_btn - so as not to risk double up eventlistener on export_csv_btn
                           setTimeout(() => this.activate(),200)
                        }
                        else {
                           if(export_csv_outcome) {
                              export_csv_outcome.innerText = export_results_obj.message
                           }
                        }
                     }
                  }
                  catch(error) {
                     if(export_csv_outcome) {
                        export_csv_outcome.innerText = 'There was an error attempting to export the records.' + error
                     }
                  }
               }
               else {
                  // to do :
               }
            })
         }

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