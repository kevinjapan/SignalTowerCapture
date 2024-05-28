import { create_section,create_h,create_p,create_div,create_button } from '../../utilities/ui_elements.js'
import { get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { extract_file_name } from '../../utilities/ui_strings.js'
import Notification from '../../components/Notification/Notification.js'
import { icon } from '../../utilities/ui_utilities.js'



// Database Backup Component

class BackupComponent {

   #context = {
      key:'BackupComponent'
   }


   render = () => {
      
      // Backup Section
      let backup_section = create_section({
         attributes:[{key:'id',value:'backup_section'}],
         classlist:['fade_in','bg_white','box_shadow','rounded','m_2','mt_2','mb_4','pb_2']
      })
      const backup_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const backup_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'Database Backups'
      })
      backup_header.append(icon('database',[]),backup_section_h)
      const backup_section_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:'Create a backup of the database.'
      })
      backup_section.append(backup_header,backup_section_desc)

      let backup_database_btn = create_button({
         attributes:[{key:'id',value:'backup_database_btn'}],
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
                     text:'Open Backup Folder'
                  }) 

                  if(backup_outcome) {
                     Notification.notify('#backup_outcome','The backup was successful.',['bg_inform'])
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
   
   get_default_context = () => {
      return this.#context
   }
}


export default BackupComponent