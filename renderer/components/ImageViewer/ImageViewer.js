import { app } from '../../renderer.js'
import { create_section,create_button,create_div } from '../../utilities/ui_elements.js'
import { get_ext,is_img_ext,get_file_type_icon,file_exists,build_img_elem } from '../../utilities/ui_utilities.js'


// User clicks on img in CollectionItemRecord to view the image larger size

class ImageViewer {

   #props

   // moving zoomed img w/ mouse
   #start_x = 0
   #start_y = 0
   #scroll_top = 0
   #scroll_left = 0

   // default zoom
   #zoom = 100

   constructor(props) {
      this.#props = props
   }

   render = async() => {

      let viewer = create_section({
         attributes:[{key:'id',value:'viewer'}],
         classlist:['text_center']
      })

      // ctrls
      let img_btn_group = create_div({
         classlist:['img_btn_group','flex','flex_col','align_items_center','pt_1','pb_1']
      })
      let x_btn = create_button({
         attributes:[{key:'id',value:'x_btn'}],
         classlist:['x_btn'],
         text:'Close'
      })
      let zoom_in_btn = create_button({
         attributes:[{key:'id',value:'zoom_in_btn'}],
         classlist:['x_btn'],
         text:'Zoom In'
      })
      let zoom_out_btn = create_button({
         attributes:[{key:'id',value:'zoom_out_btn'}],
         classlist:['x_btn'],
         text:'Zoom Out'
      })

      img_btn_group.append(x_btn,zoom_in_btn,zoom_out_btn)

      const wrapper = create_div({
         classlist:['']
      })

      // build the file_path
      let root_folder = this.#props.root_folder
      let relative_folder_path = this.#props.item['folder_path']

      // allow for empty folder_path (files in root_folder)
      if(relative_folder_path !== '') relative_folder_path += '\\'
      
      let file_path = `${root_folder}${relative_folder_path}${this.#props.item['file_name']}`

      if(await file_exists(file_path)) {
         let attributes = [{key:'id',value:'record_img'},{key:'draggable',value:false}]

         if(is_img_ext(file_path)) {
            // process img file                  
            let img = build_img_elem(file_path,'',attributes,['record_image'])
            if(img) wrapper.replaceChildren(img_btn_group,img)
         }
         else {
            // process non-img file
            const icon_img_file_path = get_file_type_icon(file_path)
            const ext = get_ext(file_path)
            let img = build_img_elem(icon_img_file_path,`${ext} file icon`,attributes,['record_image'])
            if(img) wrapper.replaceChildren(img_btn_group,img)
         }
      }
      else {
         const no_file_icon_img = build_img_elem('imgs\\icons\\exclamation-square.svg',`item date`,[{key:'height',value:'24px'}],['bg_yellow_100','mt_1'])
         viewer.append(create_div(),no_file_icon_img)
         let msg = create_div({
            classlist:['text_sm'],
            text:'The file was not found.'
         })
         viewer.append(create_div(),msg)
         viewer.append(create_div(),x_btn)
      }

      // assemble
      viewer.append(wrapper)
      return viewer
   }


   // enable buttons/links displayed in the render
   activate = () => {

      // we will register eventlisteners w/ 'viewer' to ensure cleaned up on leaving this component
      const viewer = document.getElementById('viewer')

      // Close image view
      const x_btn = document.getElementById('x_btn')
      if(x_btn) {
         x_btn.addEventListener('click',async(event) => {
            event.preventDefault()
            app.switch_to_component('Record',this.#props,false)
         })
      }
   
      // Zoom
      const zoom_in_btn = document.getElementById('zoom_in_btn')
      if(zoom_in_btn) {
         zoom_in_btn.addEventListener('click',async(event) => {
            event.preventDefault()
            const record_img = document.getElementById('record_img')
            if(record_img) {
               this.#zoom += 100
               record_img.style.minWidth = this.#zoom <= 300 ? `${this.#zoom}%` : `300%`
            }
         })
      }
      const zoom_out_btn = document.getElementById('zoom_out_btn')
      if(zoom_out_btn) {
         zoom_out_btn.addEventListener('click',async(event) => {
            event.preventDefault()
            const record_img = document.getElementById('record_img')
            if(record_img) {
               this.#zoom -= 100
               record_img.style.minWidth = this.#zoom >= 100 ? `${this.#zoom}%` : `100%`
            }
         })        
      }

      
      // Click and move zoomed img
      // we failed to change to 'move' cursor while moving - it's a bit flakey (can't both show 'move' and return to 'pointer')
      viewer.addEventListener('mousedown',(event) => {
         event.preventDefault()
         viewer.addEventListener('mousemove',this.on_mouse_move)
         this.#start_x = event.clientX
         this.#start_y = event.clientY
         this.#scroll_top = document.documentElement.scrollTop
         this.#scroll_left = document.documentElement.scrollLeft
      })
      viewer.addEventListener('mouseup',(event) => {
         event.preventDefault()
         viewer.removeEventListener('mousemove',this.on_mouse_move)
      })
   }

   on_mouse_move = (event) => {
      event.preventDefault()
      window.scrollTo({
         left: this.#scroll_left + (this.#start_x - event.clientX),
         top: this.#scroll_top + (this.#start_y - event.clientY)
      })
   }
}


export default ImageViewer