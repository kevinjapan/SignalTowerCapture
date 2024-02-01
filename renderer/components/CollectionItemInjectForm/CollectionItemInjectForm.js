import { create_section,create_h, create_p,create_div } from '../../utilities/ui_elements.js'


//
// Files - quick inject record into system
// shortcut honed-down alternative to CollectionItemForm for rapid multiple file injection 
//

class CollectionItemInjectForm {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      const inject_form_container = create_section({})
      const heading = create_h({
         level:'h1',
         text:'Collection Item Inject Form'
      })
      inject_form_container.append(heading)

      // to do : honed-down version of CollectionItemForm here - add only bare-necessary items
      //         perhaps we do need to see the image here?
  
      return inject_form_container
   }


   // enable buttons/links displayed in the render
   activate = () => {

   }

}



export default CollectionItemInjectForm