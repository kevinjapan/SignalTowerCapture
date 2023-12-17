import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'
import { create_heading,create_paragraph,create_div,create_button } from '../../utilities/ui_elements.js'



class BackupComponent {


   render = () => {
      
      const backup_component = create_div({
         classlist:['ui_component']
      })

      const heading = create_heading({
         level:'h3',
         text:'Backups'
      })
      const paragraph = create_paragraph({
         text:'Make a new timestamped folder containing a copy of the database.'
      })                
      let backup_btn = create_button({
         attributes:[
            {key:'id',value:'backup_db_btn'}
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
      backup_component.append(heading,paragraph,backup_btn,backup_outcome)

      return backup_component
   }


   // enable buttons/links displayed in the render
   activate = () => {

      const backup_db_btn = document.getElementById('backup_db_btn')
      const backup_outcome = document.getElementById('backup_outcome')

      if(backup_db_btn) {

         backup_db_btn.addEventListener('click', async() => {

            const backup_results_obj = await window.config_api.backupDatabase()

            let outcome_nofication = create_div({
               text:`\nThe backup on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.\n`
            })

            if(backup_outcome) {

               let msg = 
                  `\nThe backup on ${get_ui_ready_date(Date(),true)} at ${get_ui_ready_time(Date())} was successful.\n
               
                  The created file is ${backup_results_obj.file_name}
                  The file path is ${backup_results_obj.file_path}`                  
               let backup_folder_btn = create_button({
                  attributes:[
                     {key:'id',value:'open_backup_folder_btn'}
                  ],
                  text:'Open Backup Folders'
               }) 

               backup_outcome.replaceChildren(msg)
               backup_outcome.append(backup_folder_btn)

               // we overwrite notificaton if failed
               if(backup_results_obj.outcome) {
                  if(backup_results_obj.outcome === 'fail') {
                     backup_outcome.innerText = `Sorry, the backup failed.\nPlease check the file paths below are correct.\n` + backup_results_obj.message
                  }
               }
               this.activate()
            }
         })
      }

      const open_backup_folder_btn = document.getElementById('open_backup_folder_btn')
      if(open_backup_folder_btn) {
         open_backup_folder_btn.addEventListener('click', async() => {
            // we currently only permit saving backups to the 'backups' folder in our product folder
            // but allow direct access to this folder here (opening folder explorer)
            const sep = await window.files_api.filePathSep()
            const file_path = await window.files_api.openFolder(`.${sep}backups${sep}`)
            // ...this is to give user access to the folder containing their backups - we don't do anything in-app here
         })
      }
   }

}


export default BackupComponent