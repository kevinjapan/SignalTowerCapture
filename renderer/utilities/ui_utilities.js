import { create_img } from '../utilities/ui_elements.js'



export const is_image_file = async (file_path) => {
   

   const file_exist_result = await window.files_api.fileExists(file_path)

   if (typeof file_exist_result != "undefined") {
      if(file_exist_result.outcome === 'success') {
         if(is_img_ext(file_path)) {
            return true
         }
         else {
            return false
         }
      }
      else {
         return false
      }
   }
}

const is_img_ext = (file_name) => {
   const supported = [
      'jpg','jpeg','gif','png','svg','webp','avif','apng'
   ]
   let ext = file_name.slice(-3,file_name.length)
   return supported.some((supported_ext) => {
      return supported_ext.toUpperCase() === ext.toUpperCase()
   })
}


export const build_img_elem = async(id,file_path,alt_text = 'image',attributes = []) => {
   
   let attrs = [
      {key:'id',value:id},
      {key:'src',value:file_path},
      {key:'alt',value:alt_text},
      ...attributes
   ]

   let img = create_img({
      attributes:attrs,
      classlist:['record_image']
   })
   return img
}
