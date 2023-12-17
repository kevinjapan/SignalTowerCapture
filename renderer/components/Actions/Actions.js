import BackupComponent from '../BackupComponent/BackupComponent.js'
import ExportComponent from '../ExportComponent/ExportComponent.js'
import { create_section,create_heading } from '../../utilities/ui_elements.js'



class Actions {

   render = () => {

      let actions_section = create_section({
         attributes:[
            {key:'id',value:'actions_section'}
         ]
      })

      const actions_heading = create_heading({
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
      
      // assemble
      actions_section.append(actions_heading,backup_section,export_section)
      return actions_section
   }

   // enable buttons/links displayed in the render
   activate = () => {

   }

}


export default Actions