import { truncate,ui_friendly_text,trim_char,trim_end_char } from '../utilities/ui_strings.js'
import { create_div,create_img } from '../utilities/ui_elements.js'



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
   let ext = get_ext(file_name)
   return supported.some((supported_ext) => {
      return supported_ext.toUpperCase() === ext.toUpperCase()
   })
}


// display filetype icon
// we use closure to avoid repeatedly creating filetype_icons list
export const get_file_type_icon = function() {

   const filetype_icons = {
      'BMP':'imgs\\filetypes\\filetype-bmp.svg',
      'CSV':'imgs\\filetypes\\filetype-csv.svg',
      'DOC':'imgs\\filetypes\\filetype-doc.svg',
      'DOCX':'imgs\\filetypes\\filetype-docx.svg',
      'GIF':'imgs\\filetypes\\filetype-gif.svg',
      'HTM':'imgs\\filetypes\\filetype-html.svg',
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
      'PPTX':'imgs\\filetypes\\filetype-pptx.svg',
      'SVG':'imgs\\filetypes\\filetype-svg.svg',
      'TIF':'imgs\\filetypes\\filetype-tiff.svg',
      'TIFF':'imgs\\filetypes\\filetype-tiff.svg',
      'TXT':'imgs\\filetypes\\filetype-txt.svg',
      'WAV':'imgs\\filetypes\\filetype-wav.svg',
      'XLS':'imgs\\filetypes\\filetype-xls.svg',
      'XLSX':'imgs\\filetypes\\filetype-xlsx.svg'
   }
   return function(file_name) {
      let ext = get_ext(file_name).toUpperCase()
      return filetype_icons[ext] ? filetype_icons[ext] : 'imgs\\filetypes\\file.svg' 
   }
} ();


export const get_ext = (file_name) => {
   if(!file_name || file_name === '') return ''
   return file_name.substring(file_name.lastIndexOf('.') + 1)
}

export const remove_ext = (file_name) => {
   return file_name.replace(/\.[^/.]+$/, "")
}



export const build_img_elem = (file_path,alt_text = 'image',attributes = [],classlist = []) => {
   
   let attrs = [
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

export const filetype_icon = (filetype,ext = 'unknown',attributes = [],classlist = []) => {
   const icon = filetype.toUpperCase() === 'FILE' ? 'imgs\\filetypes\\file.svg' : 'imgs\\icons\\folder.svg'
   
   return build_img_elem(icon,`${filetype.toUpperCase() === 'DIR' ? 'Folder' : ext} filetype`,
      [{key:'height',value:'14px'},...attributes],
      ['pr_0.25','pt_0.3',...classlist]) 
}

const folder_icon = (folder_icon_type,attributes = [],classlist = []) => {
   const test = ['pr_0.25','pt_0.3',...classlist]
   const icon = folder_icon_type.toUpperCase() === 'DIR' ? 'imgs\\icons\\folder.svg' : 'imgs\\icons\\folder2-open.svg'
   return build_img_elem(icon,`${folder_icon_type.toUpperCase() === 'DIR' ? 'Folder' : 'Open Folder'}`,
      [{key:'height',value:'14px'},...attributes],
      ['pr_0.25','pt_0.3',...classlist])
}


// display icon
// we use closure to avoid repeatedly creating icons list
export const icon = function (){

   // use semantic icon_names - they will be used as alt text in clickable ctrls
   const icons = {
      'ARROW_UP':'imgs\\icons\\arrow-up-left-square.svg',
      'CARD_TEXT':'imgs\\icons\\card-text.svg',
      'CIRCLE':'imgs\\icons\\circle.svg',
      'CSV':'imgs\\filetypes\\filetype-csv.svg',
      'DATABASE':'imgs\\icons\\database.svg',
      'DEFAULT':'imgs\\icons\\person-raised-hand.svg',
      'DELETED':'imgs\\icons\\trash.svg',
      'FILE_TEXT':'imgs\\icons\\file-text.svg',
      'FILE':'imgs\\icons\\file.svg',
      'FILES':'imgs\\icons\\files.svg',
      'HISTORY_BACK':'imgs\\icons\\arrow-left-short-white.svg',
      'HISTORY_FORWARD':'imgs\\icons\\arrow-right-short-white.svg',
      'JSON':'imgs\\filetypes\\filetype-json.svg',
      'MENU_UP':'imgs\\icons\\menu-up.svg',
      'OPEN_FOLDER':'imgs\\icons\\folder2-open.svg',
      'SEARCH':'imgs\\icons\\search.svg',
      'SETTINGS':'imgs\\icons\\gear.svg',
      'TAG':'imgs\\icons\\tag.svg',
      'TRASH':'imgs\\icons\\trash.svg'
      
   }
   return function(icon_name,attributes = [],classes = []) {
      const icon_path = icons[icon_name.toUpperCase()] ? icons[icon_name.toUpperCase()] : icons['DEFAULT']
      return build_img_elem(icon_path,`${ui_friendly_text(icon_name)} icon`,[{key:'height',value:'35px'},...attributes],['pr_0.25','pt_0.5',...classes]) 
   }
} ();

// 
// Load Card images as they enter viewport.
// We don't have scope to generate sm image sizes, but we do want images in Card views.
// Compromise is we load images as they enter the viewport - allowing Card lists to space
// layout instaneously and display text while loading images just-in-time.
// Only noticable on quick scrolling - provides immediate access to text.
// 

export const init_card_img_loads = () => {
   card_img_loads()
}

const card_img_loads = () => {
   const cards = document.querySelectorAll('.record_card_image')

   // to reduce reflow issues, we only load images once they are fully in-view
   // we lose the pre-load w/ a top rootMargin, but benefit from better grid rendering 
   // allowing user to scroll and view text while images are loading
   // future : still not perfect - some delay in rendering
   // Users will scan text and images, so delay is acceptable but can be improved
   const appearOptions = {
      threshold: 0,
      rootMargin: "0px 0px 100px 0px"
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

   const filtered_q = queue.filter(item => item !== undefined)

   // remove oldest ints
   while(filtered_q.length >= max_len) {
      filtered_q.pop()
   }
   
   // push new int
   let new_queue = [int,...filtered_q]

   // remove duplicates
   return Array.from(new Set(new_queue))
}


//
// convert array of strings to array of ints
//
export const ints_array = (strings_array) => {
   if(Array.isArray(strings_array)) {
      return strings_array.map(str => {
         if(!isNaN(parseInt(str))) {
            return parseInt(str)
         }
      })
   }
}


const get_linked_path_tokens = (path) => {
   // we process backwards - reducing path str as we go
   let links = path ? [{'label':path.substring(path.lastIndexOf('\\') + 1),'path':path}] : []
   while(path.lastIndexOf('\\') > 0) {
      path = path.slice(0,path.lastIndexOf('\\'))
      if(path) {
         links.push({
            'label':path.substring(path.lastIndexOf('\\') + 1),
            'path':path
         })
      }
   }
   return links.reverse()
}

// 
// Create links to folders in a string path
// root_folder is always present and handled separately
//
export const linked_path = (root_folder,path) => {

   if(path === undefined) return ''
   path = path.replace(root_folder,'')

   const tokens = get_linked_path_tokens(path)

   // truncate link tokens if long path str
   let truncated_spacer = create_div({text:''})
   if(tokens.length > 3) {
      truncated_spacer = create_div({text:'\\   ....',classlist:['pl_1']})
      tokens.splice(0,tokens.length - 3)
   }

   // the path component
   const display_path_elem = create_div({
      classlist:['flex']
   })

   // root is a separate element
   const root_folder_link = create_div({
      attributes:[{key:'data-folder-link',value:root_folder}],
      classlist:['folder_path_link','cursor_pointer','pl_0.25','text_blue'],
      text:root_folder.substring(root_folder.lastIndexOf('\\') + 1)
   })   
   display_path_elem.prepend(folder_icon(path === '' ? 'open_folder' : 'dir',[],['align_self_center']))
   display_path_elem.append(root_folder_link,truncated_spacer)

   // folder link elements
   for(let i = 0; i < tokens.length; i++) {
      let link = create_div({
         attributes:[{key:'data-folder-link',value:tokens[i].path}],
         classlist:['flex','folder_path_link','cursor_pointer','pl_1',i < tokens.length - 1 ? 'text_blue' : ''],
         text:truncate(tokens[i].label,15)
      })
      link.prepend(folder_icon(i === tokens.length - 1 ? 'open_folder' : 'dir',[],['align_self_center']))
      link.prepend(create_div({text:'\\',classlist:['pr_0.5']}))
      display_path_elem.append(link)
   }
   return display_path_elem
}


//
// we auto-gen titles from file_names
// mirrors complementary in ui_utilities.js
//
export const title_from_file_name = (file_name) => {

   let temp = remove_ext(file_name).trim()

   // separate on '-' and '_'
   let candidate = temp.replaceAll('-',' ').replaceAll('_',' ')

   // separate on uppercase chars
   let candidate_arr = candidate.match(/[A-Z]+[^A-Z]*|[^A-Z]+/g)

   return candidate_arr.join(' ')
}

export const no_root_elem = (root_folder) => {
   window.scroll(0,0)
   return no_root_folder()
}

export const no_root_folder = () => {
   const elem = create_div({
      classlist:['bg_yellow_300','m_2','p_1','border_radius_0.5'],
      text:`Sorry, we can't find the Root Folder.
            You can set this in the Config > App Settings menu.`
   })
   return elem
}

export const no_form_fields = () => {
   const elem = create_div({
      classlist:['bg_yellow_300','m_2','p_1','border_radius_0.5'],
      text:`Sorry, we can't find the Form fields.
            There may be a problem connecting to the server.`
   })
   return elem
}

//
// Verify if given filter_name is present in context, and has a value
// 
export const has_valid_field_filter = (filter_name,context) => {
   if(!Array.isArray(context.field_filters)) return false
   let { field_filters } = context
   let target_filter = field_filters.find(filter =>  filter.field === filter_name)      
   if(target_filter && target_filter.value && target_filter.value !== '') return true
   return false
}


export const is_valid_int = (value, min = 0, max = 10000) => {
   if(Number.isInteger(parseInt(value)) && (parseInt(value) >= min) && (parseInt(value) <= max))  {
      return true
   }
   else {
      throw `This value is not a valid number.`
   }
}

export const build_file_path = (root_folder_path,relative_folder_path,file_name) => {
   
   const root_part = trim_end_char(root_folder_path,'\\')
   let relative_folder_part = trim_char(relative_folder_path,'\\')
   
   // allow for empty folder_path (files in root_folder)
   if(relative_folder_part !== '') relative_folder_part += '\\'

   const file_path = `${root_part}\\${relative_folder_part}${file_name}`
   return file_path
}

export const is_excluded_folder = async (folder_path) => {
   const result = await window.config_api.isExcludedFolder(folder_path)
   return result
}

export const build_full_path = (root_folder,folder_path,file_name) => {
   const root_part = trim_end_char(root_folder,'\\')
   let relative_folder_part = trim_char(folder_path,'\\')
   if(relative_folder_part !== '') relative_folder_part += '\\' // files in root folder
   return `${root_part}\\${relative_folder_part}${file_name}`
}

export const get_parent_folder_path = (folder_path) => {
   return folder_path.substring(0,folder_path.lastIndexOf('\\'))
}
