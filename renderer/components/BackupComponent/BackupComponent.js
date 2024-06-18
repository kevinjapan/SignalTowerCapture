import PageBanner from '../PageBanner/PageBanner.js'
import Notification from '../../components/Notification/Notification.js'
import { create_section,create_div,create_button } from '../../utilities/ui_elements.js'
import { get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { extract_file_name } from '../../utilities/ui_strings.js'



// Database Backup Component

class BackupComponent {

   #context = {
      key:'BackupComponent'
   }


   render = () => {
      
      // Backup Section
      let backup_section = create_section({
         attributes:[{key:'id',value:'backup_section'}],
         classlist:['flex','flex_col','align_items_center','px_1']
      })
      
      const page_banner = new PageBanner({
         icon_name:'database',
         title:'Database Backup',
         lead:'Create a backup of the database.'
      })
      backup_section.append(page_banner.render())

      let backup_database_btn = create_button({
         attributes:[{key:'id',value:'backup_database_btn'}],
         classlist:['action_btn','align_self_center'],
         text:'Backup Database'
      })

      const backup_outcome = create_div({
         attributes:[{key:'id',value:'backup_outcome'}]
      })

      // assemble
      backup_section.append(backup_database_btn,backup_outcome)
      return backup_section
   }


   // enable buttons/links displayed in the render
   activate = () => {

      // Backup the database
      const backup_database_btn = document.getElementById('backup_database_btn')
      const backup_section = document.getElementById('backup_section')
      const backup_outcome = document.getElementById('backup_outcome')
      if(backup_database_btn) {
         backup_database_btn.addEventListener('click',async(event) => {
            event.preventDefault()   

            // datestamp file
            const date_time_stamp = get_sqlready_datetime(false).replaceAll(':','-').replaceAll(' ','-')
 
            const options = {
               defaultPath:`stc-db-${date_time_stamp}`,
               filters:[{ name: 'Database', extensions: ['sqlite'] },]
            }

            const result = await window.files_api.openSaveFileDlg(options)

            if(result.outcome === 'success') {
               const file_name = extract_file_name(result.file_path)
               
               const backup_results_obj = await window.actions_api.backupDatabase(file_name,result.file_path)

               if(backup_results_obj.outcome === 'success') {           
                  
                  let { file_path,file_name } = backup_results_obj

                  let folder_path_only = file_path.replace(file_name,'')
                  
                  let backup_folder_btn = create_button({
                     attributes:[
                        {key:'data-folder-path',value:folder_path_only},
                        {key:'id',value:'open_backup_folder_btn'},
                     ],
                     classlist:['align_self_center'],
                     text:'Open Backup Folder'
                  }) 

                  if(backup_outcome) {
                     Notification.notify('#backup_outcome','The backup was successful.',['bg_inform'])
                  }
                  if(backup_section) {
                     backup_section.append(backup_folder_btn)
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
   
   get_default_context = () => {
      return this.#context
   }
}


export default BackupComponent