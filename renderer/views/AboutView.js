import PageBanner from '../components/PageBanner/PageBanner.js'
import { create_section,create_h, create_p } from '../utilities/ui_elements.js'



class AboutView {

   #props

   #context = {
      key:'About'
   }

   constructor(props) {
      this.#props = props
   }

   render = () => {

      const about_section = create_section()

      const page_banner = new PageBanner({
         icon_name:'',
         title:'About',
         lead:'About Signal Tower Capture'
      })
      const page_content = create_section({
         classlist:['mx_2']
      })
      const section_heading = create_h({
         level:'h2',
         classlist:['logo_heading'],
         text:'Signal Tower Capture'
      })
      const tagline = create_h({
         level:'h3',
         text:'Local Collections Management'
      })
      const lead_text = create_p({
         text:`Signal Tower Capture is a desktop digital collections solution for managing files and 
               folders on your local machine and referencing these to your local on-site collection. 
               It is ideally suited for smaller museums or archives where you need a simple solution 
               with zero-overheads and simplicity of use.`
      })      
      const tech_heading = create_h({
         level:'h3',
         text:'Technologies'
      })
      const tech_text = create_p({
         text:`Signal Tower Capture is built on the open-source Electron application framework and public domain SQLite database.`
      })
      
      // assemble
      page_content.append(
         section_heading,
         tagline,
         lead_text,
         tech_heading,
         tech_text
      )
      about_section.append(
         page_banner.render(),
         page_content
      )
      return about_section
   }

   // enable buttons/links displayed in the render
   activate = () => {}
   
   get_default_context = () => {
      return this.#context
   }
}



export default AboutView