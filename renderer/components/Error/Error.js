import { create_section,create_heading, create_paragraph } from '../../utilities/ui_elements.js'



class Error {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      let not_found = create_section()

      const heading = create_heading({
         level:'h3',
         text:'Error'
      })

      const msg = create_paragraph({
         text:this.#props.msg
      })
      const error = create_paragraph({
         text:this.#props.error
      })

      // assemble
      not_found.append(heading,msg,error)
      return not_found
   }


   // enable buttons/links displayed in the render
   activate = () => {

   }

}



export default Error