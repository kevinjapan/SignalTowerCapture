import AboutView from '../../views/AboutView.js'
import AddCollectionItemView from '../../views/AddCollectionItemView.js'
import AppConfigView from '../../views/AppConfigView.js'
import BackupDatabaseView from '../../views/BackupDatabaseView.js'
import BrowseView from '../../views/BrowseView.js'
import DeletedRecordsView from '../../views/DeletedRecordsView.js'
import ExportCSVView from '../../views/ExportCSVView.js'
import ExportJSONView from '../../views/ExportJSONView.js'
import FilesView from '../../views/FilesView.js'
import ImportCSVView from '../../views/ImportCSVView.js'
import ImportJSONView from '../../views/ImportJSONView.js'
import HomeView from '../../views/HomeView.js'
import RecentRecordsView from '../../views/RecentRecordsView.js'
import SearchView from '../../views/SearchView.js'
import TagsConfigView from '../../views/TagsConfigView.js'
import TagsView from '../../views/TagsView.js'
import CollectionItemRecord from '../CollectionItems/CollectionItemRecord/CollectionItemRecord.js'
import CollectionItemForm from '../CollectionItems/CollectionItemForm/CollectionItemForm.js'
import ImageViewer from '../ImageViewer/ImageViewer.js'
import History from '../History/History.js'
import Error from '../Error/Error.js'
import NotFound from '../NotFound/NotFound.js'
import {trim_end_char} from '../../utilities/ui_strings.js'


// The main nav corresponds to our primary components - Browse/Search etc.
// Secondary components can be utilized by multiple primary components - eg CollectionItemRecord
// Primary components provide our 'context' and pass this as a props 'context token' to their 'children' 
// or client components, allowing those secondary components to return the token on users clicking 'back' 
// - thus allowing primary components to re-initialize their context (eg search term / current page)

   
// App-wide settings loaded once and accessible to renderer

class App {

   #root_folder = ''

   #page_nav

   #history
   
   #search_term_max_len = 36

   constructor() {
      this.#history = new History(this.switch_to_component)
   }

   init = async() => {
      // App configs
      let app_config_obj = await window.config_api.getAppConfig()
      if(app_config_obj.outcome === 'success') {
         this.#root_folder = trim_end_char(app_config_obj.app_config.root_folder,'\\')
      }
      
      
      try {
         this.#search_term_max_len = await window.app_api.maxSearchTermLen()
      }
      catch(error) {
         // use initially assigned
      }
   }

   get_root_folder = () => {
      return this.#root_folder
   }

   set_root_folder = (root_folder) => {
      this.#root_folder = root_folder
   }

   set_nav = (nav) => {
      this.#page_nav = nav
   }
   
   max_search_term_len = () => {
      return this.#search_term_max_len
   }

   
   // Load component in to 'component_container'
   // future: move other appropriate components into 'Views' folder
   switch_to_component = async(component_name,props,add_to_history = true) => {

      let component_container = document.getElementById('component_container')
      if(component_container) {

         let component

         switch(component_name) {
            case 'AboutView':
               component = new AboutView(props)
               component_container.replaceChildren(component.render())
               break
            case 'AddCollectionItemView':
               component = new AddCollectionItemView(props)
               component_container.replaceChildren(component.render())
               break
            case 'AppConfigView':
               component = new AppConfigView()
               component_container.replaceChildren(await component.render())
               break
            case 'BackupDatabaseView':
               component = new BackupDatabaseView(props)
               component_container.replaceChildren(component.render())
               break
            case 'Browse':
               component = new BrowseView(props)
               component_container.replaceChildren(await component.render())
               break
            case 'DeletedRecordsView':
               component = new DeletedRecordsView(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Error':
               component = new Error(props)
               component_container.replaceChildren(component.render())
               break
            case 'ExportCSVView':
               component = new ExportCSVView()
               component_container.replaceChildren(await component.render())
               break
            case 'ExportJSONView':
               component = new ExportJSONView()
               component_container.replaceChildren(await component.render())
               break
            case 'Files':
               component = new FilesView(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Form':
               component = new CollectionItemForm(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Home':
               component = new HomeView()
               component_container.replaceChildren(component.render())
               break
            case 'ImageViewer':
               component = new ImageViewer(props)
               component_container.replaceChildren(await component.render())
               break
            case 'ImportCSVView':
               component = new ImportCSVView()
               component_container.replaceChildren(await component.render())
               break
            case 'ImportJSONView':
               component = new ImportJSONView()
               component_container.replaceChildren(await component.render())
               break
            case 'RecentRecordsView':
               component = new RecentRecordsView(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Record':
               component = new CollectionItemRecord(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Search':
               component = new SearchView(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Tags':
               component = new TagsView(props)
               component_container.replaceChildren(await component.render())
               break
            case 'TagsConfigView':
               component = new TagsConfigView()
               component_container.replaceChildren(await component.render())
               break
            default:
               console.log('not found:',component_name)
               component = new NotFound()
               component_container.replaceChildren(component.render())
               break
         }

         this.#page_nav.highlight_selected(component_name)

         if(add_to_history) {
            if(props === undefined) {
               this.#history.add_visited_page(component_name,component.get_default_context())
            } 
            else {
               this.#history.add_visited_page(component_name,props && props.context ? props.context : null)
            }
            setTimeout(() => this.#history.activate(),50)
         }
         // delay to allow rendering to complete
         setTimeout(() => component.activate(),50)
      }
   }

   // On Dlgs, we need to dim main nav (disable access)
   enable_nav = (state) => {
      const nav = document.getElementById('nav')
      if(nav) {
         state ? nav.classList.remove('nav_dimmer') : nav.classList.add('nav_dimmer')
      }
   }

   disable_page_nav = () => {      
      const select_page_buttons = document.querySelectorAll('.select_page_btn')
      if(select_page_buttons) {
         select_page_buttons.forEach((select_page_button) => {
            select_page_buttons.forEach((btn) => btn.classList.remove('selected_page'))
         })
      }
   }

   get_service = (service) => {
      switch(service.toUpperCase()) {
         case 'HISTORY':
            return this.#history
         default:
            return false
      }
   }
}


export default App