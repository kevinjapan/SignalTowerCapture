import Home from '../Home/Home.js'
import Browse from '../Browse/Browse.js'
import Search from '../Search/Search.js'
import Tags from '../Tags/Tags.js'
import AddCollectionItem from '../AddCollectionItem/AddCollectionItem.js'
import CollectionItemRecord from '../CollectionItemRecord/CollectionItemRecord.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import ImageViewer from '../ImageViewer/ImageViewer.js'
import Actions from '../Actions/Actions.js'
import ExportCSVComponent from '../ExportCSVComponent/ExportCSVComponent.js'
import ImportCSVComponent from '../ImportCSVComponent/ImportCSVComponent.js'
import ExportJSONComponent from '../ExportJSONComponent/ExportJSONComponent.js'
import ImportJSONComponent from '../ImportJSONComponent/ImportJSONComponent.js'
import DeletedRecords from '../DeletedRecords/DeletedRecords.js'
import Config from '../Config/Config.js'
import AppConfigForm from '../AppConfigForm/AppConfigForm.js'
import TagsConfig from '../TagsConfig/TagsConfig.js'
import Files from '../Files/Files.js'
import BackupComponent from '../BackupComponent/BackupComponent.js'
import RecentRecords from '../RecentRecords/RecentRecords.js'
import About from '../About/About.js'
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

   static #root_folder = ''


   init = async() => {
      const app_config_obj = await window.config_api.getAppConfig()
      if(app_config_obj.outcome === 'success') {
         // load root_folder
         App.#root_folder = trim_end_char(app_config_obj.app_config.root_folder,'\\')
      }
   }

   static get_root_folder = () => {
      return this.#root_folder
   }

   // update if user modifes Config
   static set_root_folder = (root_folder) => {
      this.#root_folder = root_folder
   }

   static switch_to_component = async(component_name,props) => {

      let component_container = document.getElementById('component_container')
      if(component_container) {

         let component

         switch(component_name) {
            case 'Home':
               component = new Home()
               component_container.replaceChildren(component.render())
               break
            case 'Browse':
               component = new Browse(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Search':
               component = new Search(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Tags':
               component = new Tags(props)
               component_container.replaceChildren(await component.render())
               break
            case 'AddCollectionItem':
               component = new AddCollectionItem(props)
               component_container.replaceChildren(component.render())
               break
            case 'Record':
               component = new CollectionItemRecord(props)
               component_container.replaceChildren(await component.render())
               break
            case 'ImageViewer':
               component = new ImageViewer(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Form':
               component = new CollectionItemForm(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Actions':
               component = new Actions()
               component_container.replaceChildren(await component.render())
               break
            case 'ExportCSVComponent':
               component = new ExportCSVComponent()
               component_container.replaceChildren(await component.render())
               break
            case 'ImportCSVComponent':
               component = new ImportCSVComponent()
               component_container.replaceChildren(await component.render())
               break
            case 'ExportJSONComponent':
               component = new ExportJSONComponent()
               component_container.replaceChildren(await component.render())
               break
            case 'ImportJSONComponent':
               component = new ImportJSONComponent()
               component_container.replaceChildren(await component.render())
               break
            case 'DeletedRecords':
               component = new DeletedRecords(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Config':
               component = new Config()
               component_container.replaceChildren(await component.render())
               break
            case 'AppConfigForm':
               component = new AppConfigForm()
               component_container.replaceChildren(await component.render())
               break
            case 'TagsConfig':
               component = new TagsConfig()
               component_container.replaceChildren(await component.render())
               break
            case 'Files':
               component = new Files(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Error':
               component = new Error(props)
               component_container.replaceChildren(component.render())
               break
            case 'About':
               component = new About(props)
               component_container.replaceChildren(component.render())
               break
            case 'BackupDatabase':
               component = new BackupComponent(props)
               component_container.replaceChildren(component.render())
               break
            case 'RecentRecords':
               component = new RecentRecords(props)
               component_container.replaceChildren(await component.render())
               break
            default:
               component = new NotFound()
               component_container.replaceChildren(component.render())
               break
         }

         // delay to allow rendering to complete
         setTimeout(() => component.activate(),100)

         setTimeout(() => init_fade_ins(),100)      
         setTimeout(() => init_fade_ins(),400)   // failsafe - harmless, guarantees fade_in
      }
   }

   // On Dlgs, we need to dim main nav (disable access)
   static enable_nav = (state) => {
      const nav = document.getElementById('nav')
      if(nav) {
         state ? nav.classList.remove('nav_dimmer') : nav.classList.add('nav_dimmer')
      }
   }

   static disable_page_nav = () => {      
      const select_page_buttons = document.querySelectorAll('.select_page_btn')
      if(select_page_buttons) {
         select_page_buttons.forEach((select_page_button) => {
            select_page_buttons.forEach((btn) => btn.classList.remove('selected_page'))
         })
      }
   }

}


export default App