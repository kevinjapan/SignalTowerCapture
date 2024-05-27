import { create_div,create_h,create_p } from '../../utilities/ui_elements.js'
import { icon } from '../../utilities/ui_utilities.js'



class PageBanner {

   #props

   constructor(props) {  
      if(props) this.#props = props
   }

   render = () => {

      const { icon_name,title,lead } = this.#props

      const page_banner = create_div({
         attributes:[{key:'id',value:'page_banner'}],
         classlist:['fade_in','bg_white','box_shadow','rounded','m_0','mt_2','mb_4','pb_2','p_1']
      })
      const recent_header = create_div({
         classlist:['flex','align_items_center','mb_0']
      })
      const recent_h = create_h({
         level:'h2',
         classlist:['mt_2','mb_0','pt_0','pb_0','w_90'],
         text:title
      })
      recent_header.append(icon(icon_name),recent_h)
      const recent_desc = create_p({
         classlist:['m_0','mb_2','pt_0','pb_0'],
         text:lead
      })
      recent_header.append(recent_desc)
      page_banner.append(recent_header)
      return page_banner
   }
}


export default PageBanner