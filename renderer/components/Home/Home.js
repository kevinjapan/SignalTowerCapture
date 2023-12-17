import { create_section,create_heading,create_form } from '../../utilities/ui_elements.js'



class Home {

   render = () => {

      let home = create_section()
      
      const home_heading = create_heading({
         level:'h1',
         classlist:['logo_heading'],
         text:'Signal Capture'
      })

      let home_form = create_form({
         attributes:[
            {key:'id',value:'injects'}
         ]
      })

      // assemble
      home.append(home_heading,home_form)
      return home
   }


   // enable buttons/links displayed in the render
   activate = () => {


   }


}



export default Home