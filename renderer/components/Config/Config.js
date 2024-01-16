import AppConfigForm from '../AppConfigForm/AppConfigForm.js'
import TagsConfig from '../TagsConfig/TagsConfig.js'
import { create_section,create_h,create_div } from '../../utilities/ui_elements.js'



class Config {


   render = async() => {

      let config_component = create_div({
         classlist:['ui_component']
      })
      
      const heading = create_h({
         level:'h3',
         text:'Config'
      })

      let config_form_wrap = create_section({
         attributes:[
            {key:'id',value:'config_form_wrap'}
         ]
      })

      // Tags
      let tags_section = create_section({
         attributes:[
            {key:'id',value:'tags_section'}
         ]
      })   
      const tags_config_component = new TagsConfig()
      if(tags_section) {
         tags_section.append(await tags_config_component.render())
         setTimeout(() => tags_config_component.activate(),200)
      }

      this.build_form(config_form_wrap)

      // assemble
      config_component.append(heading,tags_section,config_form_wrap)
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