import { create_section,create_h, create_p } from '../../utilities/ui_elements.js'



class About {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      let about_section = create_section()

      const heading = create_h({
         level:'h3',
         text:'Signal Tower Capture'
      })
      const sub_heading = create_h({
         level:'h1',
         text:'About'
      })

      // to do : about text here..

      // assemble
      about_section.append(heading,sub_heading)
      return about_section
   }


   // enable buttons/links displayed in the render
   activate = () => {

   }

}



export default About