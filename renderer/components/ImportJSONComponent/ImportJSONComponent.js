import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_section,create_button } from '../../utilities/ui_elements.js'



// to do : we need to lock app while it is working (and notify user 'working' and then 'done')
//         currently, it reports success before job is finished... and app unresponsive..


class ImportJSONComponent {

   
   render = () => {

      const import_json_component = create_section({
         attributes:[
            {key:'id',value:'import_json_component'}
         ],
         classlist:['ui_component']
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
      const import_json_outcome = document.getElementById('import_json_outcome')

      if(import_json_btn) {

            import_json_btn.addEventListener('click', async(event) => {

               event.preventDefault()
       
               // user select file dialog
               const result = await window.files_api.getFilePath()

               if(result.outcome === 'success') {

                  let file_path = result.files[0]

                  const import_results_obj = await window.config_api.importJSONFile(file_path)  

                  if (typeof import_results_obj != "undefined") { 

                     if(import_results_obj.outcome === 'success') {

                        if(import_json_outcome) {
                           import_json_outcome.innerText = 
                              `\nThe import on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.\n                 
                              `
                              // to do : report no. of records created
                        }
                     }
                     else {
                        if(import_json_outcome) {
                           import_json_outcome.innerText = 'falling through' //import_results_obj.message
                        }
                     }
                  }
               }
               // to do : else - failed to get file_path
            })
         }
   }

}



export default ImportJSONComponent