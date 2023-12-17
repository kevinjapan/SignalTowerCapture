import { create_heading,create_paragraph,create_div,create_button } from '../../utilities/ui_elements.js'




class RootFolderComponent {


   render = () => {
      
      const root_folder_component = create_div({
         classlist:['ui_component']
      })

      const heading = create_heading({
         level:'h3',
         text:'Collection Root Folder'
      })
      const tagline = create_paragraph({
         text:'Be careful here!'
      })  
      const paragraph = create_paragraph({
         text:'Your database records find their associated files in this location - so any change may require changes in every individual record.'
      }) 
      const root_folder = create_div({
         attributes:[
            {key:'id',value:'root_folder'}
         ],
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1']
      })             
      let select_root_folder_btn = create_button({
         attributes:[
            {key:'id',value:'select_root_folder_btn'}
         ],
         text:'Select Collection Root Folder'
      }) 
      const selected_root_folder = create_div({
         attributes:[
            {key:'id',value:'selected_root_folder'}
         ],
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1']
      })              
      let update_root_folder_btn = create_button({
         attributes:[
            {key:'id',value:'update_root_folder_btn'}
         ],
         text:'Set As Root Folder',
         classlist:['hidden']
      }) 
      const root_folder_outcome = create_div({
         attributes:[
            {key:'id',value:'root_folder_outcome'}
         ],
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1']
      })    

      root_folder_component.append(heading,tagline,paragraph,root_folder,select_root_folder_btn,selected_root_folder,update_root_folder_btn,root_folder_outcome)
      
      this.activate()
      this.get_root_folder(root_folder)
      return root_folder_component
   }


   // enable buttons/links displayed in the render
   activate = () => {

      const select_root_folder_btn = document.getElementById('select_root_folder_btn')
      const update_root_folder_btn = document.getElementById('update_root_folder_btn')
      const selected_folder = document.getElementById('selected_root_folder')
      const root_folder_outcome = document.getElementById('root_folder_outcome')

      if(select_root_folder_btn && selected_folder) {

         select_root_folder_btn.addEventListener('click', async() => {

            const folder_path = await window.files_api.getFolderPath()

            if(folder_path && folder_path !== '') {
               selected_folder.innerText = folder_path
               update_root_folder_btn.classList.remove('hidden')
            }
         })
      }

      if(update_root_folder_btn && selected_folder && root_folder) {

         update_root_folder_btn.addEventListener('click', async() => {

            let app_config = {
               id:root_folder.getAttribute('data-id'),
               root_folder:selected_folder.innerText
            }
            
            const result = await window.config_api.setRootFolderPath(app_config)

            if(result.outcome === 'success') {
               if(root_folder_outcome) {
                  root_folder_outcome.innerText = 'The root folder path was successfully updated.'
                  const root_folder = document.getElementById('root_folder') 
                  if(root_folder) {
                     root_folder.innerText = selected_folder.innerText
                  }
                  selected_folder.innerText = ''
                  update_root_folder_btn.classList.add('hidden')
               }
            }
            else {
               if(root_folder_outcome) {
                  root_folder_outcome.innerText = result.message
               }
            }
         })

      }
   }

   
   get_root_folder = async (root_folder_element) => {

      if(root_folder_element) {

         let result = await window.config_api.getRootFolderPath()

         if(typeof result != "undefined") {

            if(result.outcome === 'success') {

               // store id of the relevant app_config record 
               root_folder_element.setAttribute('data-id',result.app_config.id)
               
               // display current root folder
               root_folder_element.innerText = result.app_config.root_folder
            }
            else {
               root_folder_element.innerText = result.message
            }
         }  
      }

   }

}



export default RootFolderComponent