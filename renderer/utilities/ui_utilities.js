import { create_img } from '../utilities/ui_elements.js'



export const file_exists = async (file_path) => {
   const file_exist_result = await window.files_api.fileExists(file_path)
   if(typeof file_exist_result != "undefined" && file_exist_result.outcome === 'success') return true
   return false
}

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

export const is_img_ext = (file_name) => {
   const supported = [
      'jpg','jpeg','gif','png','svg','webp','avif','apng'
   ]
   let ext = file_name.slice(-3,file_name.length)
   return supported.some((supported_ext) => {
      return supported_ext.toUpperCase() === ext.toUpperCase()
   })
}

// whitelist known filetypes
// future : review - encapsulate this?
const filetype_icons = {
   'BMP':'imgs\\filetypes\\filetype-bmp.svg',
   'CSV':'imgs\\filetypes\\filetype-csv.svg',
   'DOC':'imgs\\filetypes\\filetype-doc.svg',
   'DOCX':'imgs\\filetypes\\filetype-docx.svg',
   'GIF':'imgs\\filetypes\\filetype-gif.svg',
   'HTML':'imgs\\filetypes\\filetype-html.svg',
   'JPG':'imgs\\filetypes\\filetype-jpg.svg',
   'JSON':'imgs\\filetypes\\filetype-json.svg',
   'M4P':'imgs\\filetypes\\filetype-m4p.svg',
   'MOV':'imgs\\filetypes\\filetype-mov.svg',
   'MP3':'imgs\\filetypes\\filetype-mp3.svg',
   'MP4':'imgs\\filetypes\\filetype-mp4.svg',
   'PDF':'imgs\\filetypes\\filetype-pdf.svg',
   'PNG':'imgs\\filetypes\\filetype-png.svg',
   'PPT':'imgs\\filetypes\\filetype-ppt.svg',
   'SVG':'imgs\\filetypes\\filetype-svg.svg',
   'TXT':'imgs\\filetypes\\filetype-txt.svg'
}

// Display filetype img and icon
// currently same, but we may distinguish btwn in future
export const get_file_type_img = (file_name) => {
   let ext = file_name.slice(-3,file_name.length).toUpperCase()
   return filetype_icons[ext] ? filetype_icons[ext] : 'imgs\\filetypes\\file.svg'
}
export const get_file_type_icon = (file_name) => {
   let ext = file_name.slice(-3,file_name.length).toUpperCase()
   return filetype_icons[ext] ? filetype_icons[ext] : 'imgs\\filetypes\\file.svg' 
}

export const build_img_elem = (id,file_path,alt_text = 'image',attributes = [],classlist = []) => {
   
   let attrs = [
      {key:'id',value:id},
      {key:'src',value:file_path},
      {key:'alt',value:alt_text},
      ...attributes
   ]
   let classes = [
      ...classlist
   ]

   let img = create_img({
      attributes:attrs,
      classlist:classes
   })
   return img
}


// 
// Load Card images as they enter viewport.
// We don't have scope to generate sm image sizes, but we do want images in Card views.
// Compromise is we load images as they enter the viewport - allowing Card lists to space
// layout instaneously and display text while loading images just-in-time.
// Only noticable on quick scrolling - provides immediate access to text.
//
export const init_card_img_loads = () => {
   const cards = document.querySelectorAll('.record_card_image')
   const appearOptions = {
      threshold: 0,
      rootMargin: "0px 0px 300px 0px"
   }
   return create_card_img_observers(cards,'',appearOptions)
}

const create_card_img_observers = (elements,active_class,options) => {
   let observers_created = false
   const appearOnScroll = new IntersectionObserver(
      function(entries,appearOnScroll){
         entries.forEach(entry => {
            if(!entry.isIntersecting) return
            // entry.target.classList.add(active_class)
            entry.target.src = entry.target.getAttribute('data-src')
            appearOnScroll.unobserve(entry.target)
         })
   },options)
   if(elements) {
      elements.forEach(element => {
         appearOnScroll.observe(element)
      })
      observers_created = true
   }
   return observers_created
}


//
// add int to a queue of ints
// returns new array
//
export const add_to_int_queue = (queue,max_len,int) => {

   // remove oldest ints
   while(queue.length >= max_len) {
      queue.pop()
   }
   
   // push new int
   let new_queue = [int,...queue]

   // remove duplicates
   return Array.from(new Set(new_queue))
}


//
// convert array of strings to array of ints
//
export const ints_array = (strings_array) => {
   return strings_array.map(str => {
      if(!isNaN(parseInt(str))) {
         return parseInt(str)
      }
   })
}