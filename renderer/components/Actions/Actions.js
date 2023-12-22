import BackupComponent from '../BackupComponent/BackupComponent.js'
import ExportCSVComponent from '../ExportCSVComponent/ExportCSVComponent.js'
import ExportJSONComponent from '../ExportJSONComponent/ExportJSONComponent.js'
import ImportJSONComponent from '../ImportJSONComponent/ImportJSONComponent.js'
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

      let export_csv_section = create_section({
         attributes:[
            {key:'id',value:'export_csv_section'}
         ]
      })   
      const heading = create_h({
         level:'h3',
         text:'Export Files'
      })
      
      const export_component = new ExportCSVComponent()
      if(export_csv_section) {
         export_csv_section.append(export_component.render())
         export_component.activate()
      }

      let export_json_section = create_section({
         attributes:[
            {key:'id',value:'export_json_section'}
         ]
      }) 
      const export_json_component = new ExportJSONComponent()
      if(export_json_component) {
         export_json_section.append(export_json_component.render())
         export_json_component.activate()
      }
      


      // Imports

      let import_section = create_section({
         attributes:[
            {key:'id',value:'import_section'}
         ]
      })   
      const import_heading = create_h({
         level:'h3',
         text:'Import Files'
      })
      const import_json_component = new ImportJSONComponent()
      if(import_json_component) {
         import_section.append(import_json_component.render())
         setTimeout(() => import_json_component.activate(),200)
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
      actions_section.append(actions_heading,backup_section,export_csv_section,export_json_section,import_section,deleted_files_section)
      return actions_section
   }

   // enable buttons/links displayed in the render
   activate = () => {

   }

}


export default Actions