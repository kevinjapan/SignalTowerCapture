import { create_h,create_div,create_button } from '../../utilities/ui_elements.js'
import { get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { extract_file_name } from '../../utilities/ui_strings.js'
import Notification from '../../components/Notification/Notification.js'

class BackupComponent {

   render = () => {
      
      const backup_component = create_div({
         attributes:[
            {key:'id',value:'backup_component'}
         ],
         classlist:['ui_component']
      })

      const heading = create_h({
         level:'h3',
         text:'Backups'
      })
      
      let backup_database_btn = create_button({
         attributes:[
            {key:'id',value:'backup_database_btn'}
         ],
         text:'Backup Database'
      }) 

      const backup_outcome = create_div({
         attributes:[
            {key:'id',value:'backup_outcome'}
         ],
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1']
      })

      // assemble
      backup_component.append(heading,backup_database_btn,backup_outcome)
      return backup_component
   }


   // enable buttons/links displayed in the render
   activate = () => {

      // Backup the database
      const backup_database_btn = document.getElementById('backup_database_btn')
      const backup_outcome = document.getElementById('backup_outcome')

      if(backup_database_btn) {

         backup_database_btn.addEventListener('click',async(event) => {

            event.preventDefault()   

            // datestamp file
            const date_time_stamp = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
 
            const options = {
               defaultPath:`signal-tower-capture-db-${date_time_stamp}`,
               filters:[{ name: 'Database', extensions: ['sqlite'] },]
            }

            const result = await window.files_api.saveFile(options)

            if(result.outcome === 'success') {

               const file_name = extract_file_name(result.file_path)
               
               const backup_results_obj = await window.actions_api.backupDatabase(file_name,result.file_path)

               if(backup_results_obj.outcome === 'success') {
                                  
                  let folder_path_only = backup_results_obj.file_path.replace(backup_results_obj.file_name,'')
                  
                  let backup_folder_btn = create_button({
                     attributes:[
                        {key:'data-folder-path',value:folder_path_only},
                        {key:'id',value:'open_backup_folder_btn'},
                     ],
                     text:'Open Backup Folder'
                  }) 

                  if(backup_outcome) {
                     Notification.notify('#backup_outcome','The backup was successful.')
                     backup_outcome.append(backup_folder_btn)
                  }
                 
                  this.activate_folder_btn()
               }
               else {
                  Notification.notify('#backup_outcome',backup_results_obj.message)
               }
            }
            else {
               Notification.notify('#backup_outcome',result.message)
            }
         })
      }
   }

   activate_folder_btn = () => {

      // Open the backup folder user selected
      const open_backup_folder_btn = document.getElementById('open_backup_folder_btn')

      if(open_backup_folder_btn) {

         open_backup_folder_btn.addEventListener('click', async() => {

            const folder_path = open_backup_folder_btn.getAttribute('data-folder-path')
            await window.files_api.openFolder(folder_path)

         })
      }
   }

}


export default BackupComponent