import { create_section,create_h,create_div,create_form } from '../../utilities/ui_elements.js'



class Home {

   render = () => {

      let home = create_section()
      
      const banner = create_div({
         classlist:['mb_5','p_2','pb_4']
      })
      const heading = create_h({
         level:'h1',
         classlist:['logo_heading'],
         text:'Signal Tower Capture'
      })
      const tagline = create_h({
         classlist:['ml_2'],
         level:'h3',
         text:'Desktop Digital Collections Management'
      })
      banner.append(heading,tagline)

      let home_form = create_form({
         attributes:[
            {key:'id',value:'injects'}
         ]
      })

      // assemble
      home.append(banner,home_form)
      return home
   }


   // enable buttons/links displayed in the render
   activate = () => {


   }


}



export default Home