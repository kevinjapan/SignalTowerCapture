import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_button } from '../../utilities/ui_elements.js'




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

      const paragraph = create_p({
         text:'Select destination folder.'
      }) 

      const export_json_folder = create_div({
         attributes:[
            {key:'id',value:'export_json_folder'}
         ],
         classlist:['export_folder','bg_lightgrey','mt_1','pl_1','pr_1']
      })   
  
      let export_json_btn = create_button({
         attributes:[
            {key:'id',value:'export_json_btn'}
         ],
         text:'Export JSON File'
      })  

      const export_json_folder_outcome = create_div({
         attributes:[
            {key:'id',value:'export_json_folder_outcome'}
         ],
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1']
      })

      const export_json_outcome = create_div({
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'export_json_outcome'}
         ]
      })

      const export_json_fields = create_div({
         classlist:['break_words','bg_lightgrey','text_grey','italic','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'export_json_fields'}
         ]
      })
      
      // assemble
      export_json_component.append(heading,paragraph,export_json_folder,export_json_btn,export_json_folder_outcome,export_json_outcome,export_json_fields)
      
      this.activate()
      this.get_export_folder(export_json_folder)
      return export_json_component
   }


   // enable buttons/links displayed in the render
   activate = async () => {


      // Export Folder and Export CSV File

      const sep = await window.files_api.filePathSep()

      const export_json_btn = document.getElementById('export_json_btn')
      const export_json_outcome = document.getElementById('export_json_outcome')

      if(export_json_btn) {

            export_json_btn.addEventListener('click', async(event) => {

               event.preventDefault()
               
               const export_results_obj = await window.config_api.exportJSONFile()  

               if (typeof export_results_obj != "undefined") { 

                  if(export_results_obj.outcome === 'success') {

                     if(export_json_outcome) {
                        export_json_outcome.innerText = 
                           `\nThe export on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.\n                 
                           The created file is ${export_results_obj.file_path}${sep}${export_results_obj.file_name}`
                     }
                  }
                  else {
                     if(export_json_outcome) {
                        export_json_outcome.innerText = export_results_obj.message
                     }
                  }
               }
            })
         }
   }

   
   get_export_folder = async (export_json_folder_elem) => {

      if(export_json_folder_elem) {

         let result = await window.config_api.getExportFolder()

         if(typeof result != "undefined") {

            if(result.outcome === 'success') {

               // store id of the relevant app_config record 
               export_json_folder_elem.setAttribute('data-id',result.app_config.id)
               
               // display current root folder
               export_json_folder_elem.innerText = result.app_config.export_json_folder
            }
            else {
               export_json_folder_elem.innerText = result.message
            }

         }  
      }
   }

}



export default ExportJSONComponent