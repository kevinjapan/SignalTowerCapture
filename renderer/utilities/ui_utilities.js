import { create_img } from '../utilities/ui_elements.js'



export const is_image_file = async (folder_path,file_name) => {
   
   const sep = await window.files_api.filePathSep()
   const separator = folder_path.slice(-1) !== sep ? sep : ''   
   const full_path = folder_path + separator + file_name

   const file_exist_result = await window.files_api.fileExists(full_path.toString())

   if (typeof file_exist_result != "undefined") {
      if(file_exist_result.outcome === 'success') {
         if(is_img_ext(file_name)) {
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


export const build_img_elem = async(id,folder_path,file_name,alt_text = 'image',attributes = []) => {
   
   const sep = await window.files_api.filePathSep()
   let separator = folder_path.slice(-1) !== sep ? sep : ''

   let attrs = [
      {key:'id',value:id},
      {key:'src',value:folder_path + separator + file_name},
      {key:'alt',value:alt_text},
      ...attributes
   ]

   let img = create_img({
      attributes:attrs,
      classlist:['record_image']
   })
   return img
}
