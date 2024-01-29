import { create_section,create_h, create_p } from '../../utilities/ui_elements.js'



class FileInjector {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      // console.log(this.#props)
                  
                  // - check does file match an existing record?
                  // - if yes, notify
                  // - if no, auto-gen a record with option to edit and save

      let not_found = create_section()

      const heading = create_h({
         level:'h3',
         text:'File Injector'
      })

      const file = create_p({
         text:this.#props.file
      })

      // assemble
      not_found.append(heading,file)
      return not_found
   }


   // enable buttons/links displayed in the render
   activate = () => {

   }

}



export default FileInjector