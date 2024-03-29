import {create_div} from '../../utilities/ui_elements.js'
import {linked_path} from '../../utilities/ui_utilities.js'


// BreadCrumb Nav for folder paths in Files


class BreadCrumbNav {

   // all paths are relative to the root_folder
   #root_folder

   // client provides a callback for handling click on folder link
   #open_folder


   constructor(open_folder_callback) {
      this.#open_folder = open_folder_callback
   }

   render = () => {

      const breadcrumb = create_div({
         attributes:[
            {key:'id',value:'breadcrumb_nav'},
         ],
         classlist:['p_1','text_lg'],
         text:'Please select a folder.'
      })
      return breadcrumb
   }

   hydrate = (root_folder,folder_path) => {
      this.#root_folder = root_folder
      folder_path = folder_path.toString().replace(root_folder,'')
      const breadcrumb = document.getElementById('breadcrumb_nav')
      if(breadcrumb) {
         breadcrumb.replaceChildren(linked_path(root_folder,folder_path))
      }
   }

   // enable buttons/links displayed in the render
   activate = async () => {

      // User clicks on linked part of current folder path
      const folder_path_links = document.querySelectorAll('.folder_path_link')
      if(folder_path_links) {
         folder_path_links.forEach(folder_path_link => {
            folder_path_link.addEventListener('click',async(event) => {
               const path = event.target.getAttribute('data-folder-link').replace(this.#root_folder,'')            
               this.#open_folder(path)
            })
         })
      }
   }
}

export default BreadCrumbNav