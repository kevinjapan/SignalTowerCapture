import BackupComponent from '../BackupComponent/BackupComponent.js'
import ExportCSVComponent from '../ExportCSVComponent/ExportCSVComponent.js'
import ImportCSVComponent from '../ImportCSVComponent/ImportCSVComponent.js'
import ExportJSONComponent from '../ExportJSONComponent/ExportJSONComponent.js'
import ImportJSONComponent from '../ImportJSONComponent/ImportJSONComponent.js'
import ActionsLogComponent from '../ActionsLogComponent/ActionsLogComponent.js'
import DeletedRecordsTeaser from '../DeletedRecordsTeaser/DeletedRecordsTeaser.js'
import { create_section,create_div,create_h,create_p } from '../../utilities/ui_elements.js'
import { icon } from '../../utilities/ui_utilities.js'


// future : depr - remove this file



class Actions {

   #csv_actions_log_component

   #json_actions_log_component

   render = async() => {

      let actions_section = create_section({
         attributes:[
            {key:'id',value:'actions_section'}
         ],
         classlist:['mb_2','pb_2']
      })

      // Backup Section
      //
      let backup_section = create_section({
         attributes:[
            {key:'id',value:'backup_section'}
         ],
         classlist:['bg_white','box_shadow','rounded','m_2','mt_2','mb_4','pb_2']
      })
      const backup_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const backup_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'Backups'
      })
      backup_header.append(icon('database',[]),backup_section_h)
      const backup_section_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:'Create a backup of the database.'
      })
      backup_section.append(backup_header,backup_section_desc)
      const backup_component = new BackupComponent()
      if(backup_section) {
         backup_section.append(backup_component.render())
         setTimeout(() => backup_component.activate(),200)
      }


      // CSV Section
      //
      let csv_section = create_section({
         attributes:[
            {key:'id',value:'csv_section'}
         ],
         classlist:['bg_white','box_shadow','rounded','m_2','mt_2','mb_4','pb_2']
      })   
      const csv_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const csv_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'CSV Files'
      })
      csv_header.append(icon('csv'),csv_section_h)
      const csv_section_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:'Comma-Separated-Value (CSV) files are a common file format for tranfering data between applications.'
      })
      csv_section.append(csv_header,csv_section_desc)

      const export_csv_component = new ExportCSVComponent()
      if(csv_section) {
         csv_section.append(export_csv_component.render())
         setTimeout(() => export_csv_component.activate(),200)
      }
      const import_csv_component = new ImportCSVComponent()
      if(csv_section) {
         csv_section.append(await import_csv_component.render())
         setTimeout(() => import_csv_component.activate(),200)
      }
      
      const csv_history_section = create_div({
         attributes:[
            {key:'id',value:'csv_history_section'}
         ]
      })
      this.#csv_actions_log_component = new ActionsLogComponent('import_csv','CSV Import History')
      if(this.#csv_actions_log_component) {
         csv_history_section.append(await this.#csv_actions_log_component.render('import_csv'))
         setTimeout(() => this.#csv_actions_log_component.activate(),200)
      }
      csv_section.append(csv_history_section)


      // JSON Section
      //
      let json_section = create_section({
         attributes:[
            {key:'id',value:'json_section'}
         ],
         classlist:['bg_white','box_shadow','rounded','m_2','mt_2','mb_4','pb_2']
      })
      const json_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const json_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'JSON Files'
      })
      json_header.append(icon('json'),json_section_h)
      const json_section_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:`JavaScript Object Notation (JSON) files are a human-readable file format for tranfering data between applications.
         They are better suited for moving small sets of data where some manual manipulation is needed.`
      })
      json_section.append(json_header,json_section_desc)

      const export_json_component = new ExportJSONComponent()
      if(json_section) {
         json_section.append(export_json_component.render())
         setTimeout(() => export_json_component.activate(),200)
      }
      const import_json_component = new ImportJSONComponent()
      if(json_section) {
         json_section.append(import_json_component.render())
         setTimeout(() => import_json_component.activate(),200)
      }

      const json_history_section = create_div({
         attributes:[
            {key:'id',value:'json_history_section'}
         ]
      })
      this.#json_actions_log_component = new ActionsLogComponent('import_json','JSON Import History')
      if(this.#json_actions_log_component) {
         json_history_section.append(await this.#json_actions_log_component.render('import_json'))
         setTimeout(() => this.#json_actions_log_component.activate(),200)
      }
      json_section.append(json_history_section)

      
      // Records Section
      //
      // Soft Deleted Files Admin
      let records_section = create_section({
         attributes:[
            {key:'id',value:'records_section'}
         ],
         classlist:['bg_white','box_shadow','rounded','m_2','mt_2','mb_4','pb_2']
      })    
      const records_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const records_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'Records'
      })
      records_header.append(icon('file_text'),records_section_h)
      const records_section_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:'Manage records here.'
      })
      records_section.append(records_header,records_section_desc)
      const managed_deleted_component = new DeletedRecordsTeaser()
      if(records_section) {
         records_section.append(managed_deleted_component.render())
         setTimeout(() => managed_deleted_component.activate(),200)
      }

      window.scroll(0,0)

      // assemble
      actions_section.append(backup_section,csv_section,json_section,records_section)
      return actions_section
   }

   // enable buttons/links displayed in the render
   activate = () => {

   }

   //
   // import callbacks for updating ActionsLogs
   // we refresh regardless of outcome
   //
   import_csv_completed = async() => {
      const csv_history_section = document.getElementById('csv_history_section')
      if(csv_history_section && this.#csv_actions_log_component) {
         // delay to prevent getting ahead of changes 
         setTimeout(async() => {
            csv_history_section.replaceChildren(await this.#csv_actions_log_component.render('import_csv'))
            this.#csv_actions_log_component.extend_list()
            setTimeout(() => this.#csv_actions_log_component.activate(),200)
         },500)
      }
   }

   import_json_completed = async() => {
      const json_history_section = document.getElementById('json_history_section')
      if(json_history_section && this.#json_actions_log_component) {
         // delay to prevent getting ahead of changes 
         setTimeout(async() => {
            json_history_section.replaceChildren(await this.#json_actions_log_component.render('import_json'))
            this.#json_actions_log_component.extend_list()
            setTimeout(() => this.#json_actions_log_component.activate(),200)
         },500)
      }
   }

}


export default Actions