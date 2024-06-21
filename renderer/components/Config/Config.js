import AppConfigForm from '../AppConfigForm/AppConfigForm.js'
import TagsConfig from '../TagsConfig/TagsConfig.js'
import { create_section,create_div,create_h,create_p } from '../../utilities/ui_elements.js'
import { icon } from '../../utilities/ui_utilities.js'


// to do : this file depr?

class Config {

   #context = {
      key:'Config'
   }

   render = async() => {

      let config_component = create_section({
         attributes:[
            {key:'id',value:'config_component'}
         ]
      })

      let config_form_wrap = create_section({
         attributes:[
            {key:'id',value:'config_form_wrap'}
         ]
      })

      //
      // Tags
      //
      let tags_section = create_section({
         attributes:[
            {key:'id',value:'tags_section'}
         ],
         classlist:['bg_white','box_shadow','rounded','m_2','mb_2','pb_2']
      })
      const tags_header = create_div({
         classlist:['flex','align_items_center']
      })
      const tags_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'Tags'
      })
      tags_header.append(icon('tag'),tags_section_h)
      const tags_section_desc = create_p({
         classlist:['mt_0','mb_0','pt_0','pb_0'],
         text:`You can 'tag' records with keywords or categories, and then upon searching for a 
         given tag, all the matching 'tagged' records will be found.
         This can be useful for grouping records which are physically
         separate in your Collections folder. For example, the tag
         'education' might pertain to individual files across multiple folders.`

      })
      tags_section.append(tags_header,tags_section_desc)
      const tags_config_component = new TagsConfig()
      if(tags_section) {
         tags_section.append(await tags_config_component.render())
         setTimeout(() => tags_config_component.activate(),200)
      }

      //
      // Config Form
      // This form contains all settings which are held in app_config database table
      //
      let app_settings_section = create_section({
         attributes:[
            {key:'id',value:'app_settings_section'}
         ],
         classlist:['bg_white','box_shadow','rounded','m_2','mt_4','mb_2','pb_2']
      })
      const app_settings_header = create_div({
         classlist:['flex','align_items_center']
      })
      const app_settings_section_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0'],
         text:'App Settings'
      })
      app_settings_header.append(icon('settings'),app_settings_section_h)
      const app_settings_section_desc = create_p({
         classlist:['mt_0','mb_0','pt_0','pb_0'],
         text:`Update your application settings here.`

      })
      app_settings_section.append(app_settings_header,app_settings_section_desc)
      this.build_form(config_form_wrap)
      app_settings_section.append(config_form_wrap)

      window.scroll(0,0)
      console.log('to do : why isnt this scroll working?')


      // assemble
      config_component.append(
         tags_section,
         app_settings_section
      )
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

   get_default_context = () => {
      return this.#context
   }
}


export default Config