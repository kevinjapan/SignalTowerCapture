import App from './components/App/App.js'
import Nav from './components/Nav/Nav.js'
import { create_ul,create_li } from './utilities/ui_elements.js'



//
// Pattern 1: Renderer to main (one-way)
// leverages the window.electronAPI functionality exposed from the preload script:
//
const setButton = document.getElementById('btn')
const titleInput = document.getElementById('title')
if(setButton) {
   setButton.addEventListener('click', () => {
   const title = titleInput.value
   window.electronAPI.setTitle(title)
   })
}



//
// Pattern 2: Renderer to main (two-way)
//
const open_folder_btn = document.getElementById('open_folder_btn')
const current_folder = document.getElementById('current_folder')
const folder_path_elem = document.getElementById('folder_path')
if(open_folder_btn) {
   open_folder_btn.addEventListener('click', async() => {
      const folder_path = await window.files_api.openFile()
      const filenames = folder_path  

      if(filenames) {
         
         let list = create_ul()
         let list_item

         if(Array.isArray(filenames)) {
            filenames.forEach(file => {

               list_item = create_li({
                  attributes:[
                     {key:'data-path',value:file.path}
                  ],
                  classlist:['folder_item'],
                  text:file.type + ' ' + file.filename
               })

               list.append(list_item)

            })
         }
         
         // assemble
         folder_path_elem.appendChild(list)
         current_folder.innerText = filenames[0].filename
         init_folder_items()
      }
   })
}


//
// Click on folder/file in current file list
//
const init_folder_items = () => {
   const folder_item_elements = document.querySelectorAll('.folder_item')
   if(folder_item_elements) {
      folder_item_elements.forEach((folder_item_element) => {
         folder_item_element.addEventListener('click', (event) => {
            //console.log(event.target.attributes['data-path'].value)   // to do : review
         })
      })
   }
}



//
// Pattern 3: Main to renderer
// pass in a callback to the window.electronAPI.onUpdateCounter function exposed from our preload script. 

// 
// Simple alert notifications
//
window.notify_api.onNotification((event,value) => {
   alert(value)
})

//
// Handle native app menu item clicks
//
window.component_api.onSwitchComponent((event,value) => {

   // deselect all page nav items
   app.disable_page_nav()

   // switch component
   app.switch_to_component(value)
})



let back_btns = document.querySelectorAll('.back_btn')
if(back_btns){
   back_btns.forEach(back_btn => {
      back_btn.addEventListener('click',(event) => {
         history.back()
      })
   })
}


//
// Init App
// App provides app-wide settings eg root_folder
//
export const app = new App()

// load Home page on startup
setTimeout(() => app.switch_to_component('Home'),100)


//
// Init main navigation
//
const nav = new Nav()
nav.init()
nav.activate()

// register nav w/ app
app.set_nav(nav)