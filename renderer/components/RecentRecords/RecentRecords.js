import { create_section,create_h, create_p } from '../../utilities/ui_elements.js'



class RecentRecords {

   #props

   constructor(props) {
      this.#props = props
   }

   render = async() => {

      let record_result_obj = await this.get_app_config_record()
      let app_config_record = record_result_obj.app_config
      
      console.log('app_config_record',app_config_record)

      let about_section = create_section()

      const heading = create_h({
         level:'h1',
         text:'Recent Records'
      })

      const temp_text = create_p({
         text:`To do : list recent records here (from app_config.recent_records)`
      })
      const temp_text2 = create_p({
         text:`To do : update app_config.recent_records on every new record viewed. (10)`
      })

      

      

      // assemble
      about_section.append(heading,temp_text,temp_text2)
      return about_section
   }


   // enable buttons/links displayed in the render
   activate = () => {

   }

   async get_app_config_record() {
      return await window.config_api.getAppConfig()
   }

}



export default RecentRecords