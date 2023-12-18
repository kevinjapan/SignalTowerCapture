import BackupComponent from '../BackupComponent/BackupComponent.js'
import ExportComponent from '../ExportComponent/ExportComponent.js'
import DeletedRecordsTeaser from '../DeletedRecordsTeaser/DeletedRecordsTeaser.js'
import { create_section,create_h } from '../../utilities/ui_elements.js'



class Actions {

   render = () => {

      let actions_section = create_section({
         attributes:[
            {key:'id',value:'actions_section'}
         ]
      })

      const actions_heading = create_h({
         level:'h1',
         text:'Actions'
      })


      // Backups

      let backup_section = create_section({
         attributes:[
            {key:'id',value:'backup_section'}
         ]
      })
      const backup_component = new BackupComponent()
      if(backup_section) {
         backup_section.append(backup_component.render())
         setTimeout(() => backup_component.activate(),200)
      }


      // Exports

      let export_section = create_section({
         attributes:[
            {key:'id',value:'export_section'}
         ]
      })
      const export_component = new ExportComponent()
      if(export_section) {
         export_section.append(export_component.render())
         export_component.activate()
      }
      

      // Soft Deleted Files Admin

      let deleted_files_section = create_section({
         attributes:[
            {key:'id',value:'deleted_files_section'}
         ]
      })
      const managed_deleted_component = new DeletedRecordsTeaser()
      if(deleted_files_section) {
         deleted_files_section.append(managed_deleted_component.render())
         setTimeout(() => managed_deleted_component.activate(),200)
      }


      // assemble
      actions_section.append(actions_heading,backup_section,export_section,deleted_files_section)
      return actions_section
   }

   // enable buttons/links displayed in the render
   activate = () => {

   }

}


export default Actions