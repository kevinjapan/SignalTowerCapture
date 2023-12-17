import App from '../App/App.js'
import { create_section,create_heading,create_button } from '../../utilities/ui_elements.js'
import { is_image_file, build_img_elem } from '../../utilities/ui_utilities.js'


// User clicks on img in CollectionItemRecord to view the image larger size



class ImageViewer {

   #props

   constructor(props) {
      this.#props = props
      console.log('IV',props)
   }

   render = async() => {

      let viewer = create_section({
         classlist:['border']
      })

      let x_btn = create_button({
         attributes:[
            {key:'id',value:'x_btn'}
         ],
         classlist:['x_btn'],
         text:'X'
      })
      
      const heading = create_heading({
         level:'h1',
         text:'Image Viewer'
      })

      if(await is_image_file(this.#props.item['parent_folder_path'],this.#props.item['file_name'])) {   

         let img = await build_img_elem('record_img',this.#props.item['parent_folder_path'],this.#props.item['file_name'])
         if(img) {
            viewer.append(x_btn,img)
         }
      }
      else {
         viewer.append(create_div(),document.createTextNode('No image file was found.'))
      }

      // assemble
      viewer.append(heading)
      return viewer
   }

   // enable buttons/links displayed in the render
   activate = () => {

      const x_btn = document.getElementById('x_btn')

      if(x_btn) {
         x_btn.addEventListener('click',async(event) => {
            App.switch_to_component('Record',this.#props)
         })
      }
   }
}


export default ImageViewer