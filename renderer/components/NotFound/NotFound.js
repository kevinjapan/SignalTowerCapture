import { create_section,create_h } from '../../utilities/ui_elements.js'



class NotFound {

   render = () => {

      let not_found = create_section()

      const not_found_heading = create_h({
         level:'h1',
         text:'Not Found'
      })

      // assemble
      not_found.append(not_found_heading)
      return not_found
   }

   // enable buttons/links displayed in the render
   activate = () => {

   }

}


export default NotFound