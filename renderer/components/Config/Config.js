import AppConfigForm from '../AppConfigForm/AppConfigForm.js'
import { create_section,create_heading,create_div } from '../../utilities/ui_elements.js'



class Config {


   render = () => {

      let config_component = create_div({
         classlist:['ui_component']
      })
      
      const heading = create_heading({
         level:'h3',
         text:'Config'
      })

      let config_form_wrap = create_section({
         attributes:[
            {key:'id',value:'config_form_wrap'}
         ]
      })

      this.build_form(config_form_wrap)

      // assemble
      config_component.append(heading,config_form_wrap)
      return config_component
   }

   build_form = async(config_form_wrap) => {
      const app_config_form = new AppConfigForm()
      config_form_wrap.append(await app_config_form.render())
      app_config_form.activate()
   
   }

   // enable buttons/links displayed in the render
   activate = () => {

   }

}


export default Config