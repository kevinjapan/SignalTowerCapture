import App from './components/App/App.js'
import Nav from './components/Nav/Nav.js'


//
// Init App
// App provides app-wide settings eg root_folder
//
export const app = new App()

// load Home page on startup
setTimeout(() => app.switch_to_component('Home'),100)



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


// to do : review - need this here?
let back_btns = document.querySelectorAll('.back_btn')
if(back_btns){
   back_btns.forEach(back_btn => {
      back_btn.addEventListener('click',(event) => {
         history.back()
      })
   })
}


//
// Init main navigation
//
const nav = new Nav()
nav.init()
nav.activate()

// register nav w/ app
app.set_nav(nav)