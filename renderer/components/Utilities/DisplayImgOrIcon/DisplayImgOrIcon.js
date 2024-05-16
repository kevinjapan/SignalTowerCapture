import { create_div } from '../../../utilities/ui_elements.js'
import { get_ext,is_img_ext,get_file_type_icon,file_exists,build_img_elem } from '../../../utilities/ui_utilities.js'



class DisplayImgOrIcon {

   static render = async(parent_elem,file_path,alt_text) => {
      if(await file_exists(file_path)) {
         if(is_img_ext(file_path)) {
            // process img file            
            let img = build_img_elem(file_path,alt_text,[{key:'id',value:'record_img'}],['record_image'])
            if(img) parent_elem.replaceChildren(create_div(),img)
         } 
         else {
            // process non-img file
            const icon_img_file_path = get_file_type_icon(file_path)
            const ext = get_ext(file_path)
            let img = build_img_elem(icon_img_file_path,`${ext} file icon`,[{key:'id',value:'record_img'},{key:'width',value:'48px'},{key:'height',value:'48px'}],['record_image'])
            if(img) parent_elem.replaceChildren(create_div(),img)
         }
      }
      else {
         // notify no file was found
         const no_file_icon_img = build_img_elem('imgs\\icons\\exclamation-square.svg',`item date`,[{key:'height',value:'24px'}],['bg_yellow_100','mt_1'])
         img_col.append(create_div(),no_file_icon_img)
         let msg = create_div({
            classlist:['text_sm'],
            text:'The file was not found.'
         })
         parent_elem.append(create_div(),msg)
      } 
   }
}

export default DisplayImgOrIcon