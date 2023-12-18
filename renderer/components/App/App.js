import Home from '../Home/Home.js'
import Browse from '../Browse/Browse.js'
import Search from '../Search/Search.js'
import AddCollectionItem from '../AddCollectionItem/AddCollectionItem.js'
import CollectionItemRecord from '../CollectionItemRecord/CollectionItemRecord.js'
import CollectionItemForm from '../CollectionItemForm/CollectionItemForm.js'
import ImageViewer from '../ImageViewer/ImageViewer.js'
import Actions from '../Actions/Actions.js'
import Config from '../Config/Config.js'
import Files from '../Files/Files.js'
import Error from '../Error/Error.js'
import NotFound from '../NotFound/NotFound.js'


// The main nav corresponds to our primary components - Browse/Search etc.
// Secondary components can be utilized by multiple primary components - eg CollectionItemRecord
// Primary components provide our 'context' and pass this as a props 'context token' to their 'children' 
// or client components, allowing those secondary components to return the token on users clicking 'back'
// - allowsing primary components to re-initialize their original context from the token (eg search/page)



class App {

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
            case 'AddCollectionItem':
               component = new AddCollectionItem(props)
               component_container.replaceChildren(component.render())
               break
            case 'Record':
               component = new CollectionItemRecord(props)
               component_container.replaceChildren(component.render())
               break
            case 'ImageViewer':
               component = new ImageViewer(props)
               component_container.replaceChildren(await component.render())
               break
            case 'Form':
               component = new CollectionItemForm(props)
               component_container.replaceChildren(component.render())
               break
            case 'Actions':
               component = new Actions()
               component_container.replaceChildren(component.render())
               break
            case 'Config':
               component = new Config()
               component_container.replaceChildren(component.render())
               break
            case 'Files':
               component = new Files()
               component_container.replaceChildren(component.render())
               break
            case 'Error':
               component = new Error(props)
               component_container.replaceChildren(component.render())
               break
            default:
               component = new NotFound()
               component_container.replaceChildren(component.render())
               break
         }

         // short delay to allow rendering to complete
         setTimeout(() => component.activate(),300)
      }
   }
}


export default App