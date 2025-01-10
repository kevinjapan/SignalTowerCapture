import { create_div, create_h, create_p } from '../../utilities/ui_elements.js'
import { icon } from '../../utilities/ui_utilities.js'



class PageBanner {

   #props

   constructor(props) {  
      if(props) this.#props = props
   }

   render = () => {

      const { icon_name,title,lead } = this.#props

      const banner = create_div({
         attributes:[{key:'id',value:'banner'}],
         classlist:['bg_white','box_shadow','rounded','m_2','mt_2','mb_1','p_0.5']
      })

      const banner_header = create_div({
         classlist:['flex','justify_center','align_items_center','mb_0']
      })
      const banner_h = create_h({
         level:'h2',
         classlist:['mt_0.25','mb_0.5','pt_0','pb_0','w_90'],
         text:title
      })
      const banner_icon = icon(
         icon_name,[],['mt_0','mr_1']
      )
      banner_header.append(banner_icon,banner_h)

      const banner_desc = create_p({
         classlist:['m_0','mb_1','pt_0','pb_0','ml_2'],
         text:lead
      })

      banner.append(banner_header,banner_desc)
      return banner
   }
}


export default PageBanner