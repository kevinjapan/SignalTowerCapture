import { create_section,create_h, create_p } from '../../utilities/ui_elements.js'



class About {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      let about_section = create_section({classlist:['fade_in']})

      const heading = create_h({
         level:'h1',
         text:'About'
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
         text:`Signal Tower Capture is a desktop digital collections solution for managing files and folders on your local machine and referencing these to your local on-site collection. It is ideally suited for smaller museums or archives where you need a simple solution with zero-overheads and simplicity of use.`
      })
      
      const tech_heading = create_h({
         level:'h3',
         text:'Technologies'
      })
      const tech_text = create_p({
         text:`Signal Tower Capture is built on the open-source Electron application framework and public domain SQLite database.`
      })
      
      // assemble
      about_section.append(heading,section_heading,tagline,lead_text,tech_heading,tech_text)
      return about_section
   }

   // enable buttons/links displayed in the render
   activate = () => {}

}



export default About