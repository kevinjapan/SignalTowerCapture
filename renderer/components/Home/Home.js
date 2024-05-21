import { create_section,create_h,create_div,create_form } from '../../utilities/ui_elements.js'
import { build_img_elem } from '../../utilities/ui_utilities.js'


class Home {

   render = () => {

      let home = create_section({
         classlist:['home_section','mt_0','pt_0']
      })
      
      const main_feature_block = create_section({
         classlist:['feature_block','fade_in','my_2','p_0','bg_yellow','rounded']
      })

      const feature_text = create_div({
         classlist:['feature_text']
      })
      const heading_2 = create_h({
         level:'h1',
         classlist:['logo_heading','mb_0','m_0'],
         text:'Signal Tower Capture'
      })
      const tagline = create_h({
         classlist:['logo_heading','m_0','mt_2','text_weight_200'],
         level:'h2',
         text:'Desktop Digital Collections Management'
      })
      feature_text.append(heading_2,tagline)

      const attributes = [
         {key:'id',value:'record_img'},
         {key:'draggable',value:false}
      ]
      const feature_img = build_img_elem('imgs/home_3.jpg','',attributes,['h_100'])

      let home_form = create_form({
         attributes:[
            {key:'id',value:'injects'}
         ]
      })

      // assemble
      main_feature_block.append(feature_text,feature_img)
      home.append(main_feature_block,home_form)

      return home
   }

   // enable buttons/links displayed in the render
   activate = () => {}

}



export default Home