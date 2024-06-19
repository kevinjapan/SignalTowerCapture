import { icon } from '../../utilities/ui_utilities.js'


// Arrow-icon Link to parent folder

class ParentLink {

   render = (root_folder,parent_folder_path,enabled = true) => {
      return icon('arrow_up',
         [
            {key:'id',value:'parent_link_elem'},
            {key:'data-parent-folder',value:parent_folder_path.replace(root_folder,'')},
            {key:'width',value:'14px'},
            {key:'height',value:'14px'}
         ],
         ['cursor_pointer','mt_0','mb_1','ml_0',`${enabled ? '' : 'disabled_arrow_icon'}`]
      )
   }

   // enable buttons/links displayed in the render
   activate = () => {}

}


export default ParentLink