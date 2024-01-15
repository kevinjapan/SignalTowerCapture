import DevTools from '../DevTools/DevTools.js'
import { create_section,create_h,create_form } from '../../utilities/ui_elements.js'



class Home {

   render = () => {

      let home = create_section()
      
      const home_heading = create_h({
         level:'h1',
         classlist:['logo_heading'],
         text:'Signal Tower Capture'
      })

      let home_form = create_form({
         attributes:[
            {key:'id',value:'injects'}
         ]
      })

      let dev_tools = new DevTools()


      // assemble
      home.append(home_heading,home_form,dev_tools.render())
      return home
   }


   // enable buttons/links displayed in the render
   activate = () => {


   }


}



export default Home