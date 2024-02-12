import FileInjector from '../FileInjector/FileInjector.js'
import Notification from '../Notification/Notification.js'
import { trim_end_char } from '../../utilities/ui_strings.js'
import {
   create_section,
   create_h,
   create_div,
   create_button,
   create_ul,
   create_li
} from '../../utilities/ui_elements.js'



class Files {
   
   // the Collection Root Folder
   #root_folder = ''

   // find matching existing records in db
   #matching_records = []

   // list of fields inside a record
   #record_fields

   // context and other props
   #props

   // we retain state by passing a 'context token'
   #context = {
      key:'Files',
      field_filters:[
         {field:'folder_path',value:''}
      ],
      page:1,
      scroll_y:0
   }

   constructor(props) {
      this.#props = props
      console.log('Files.props',props)
      
      // to do : if props contains specified folder - open that folder immediately..

      // this.#props.context.selected_folder  

   }


   render = async() => {

      // container
      const files_section = create_section({
         attributes:[
            {key:'id',value:'files_section'}
         ]
      })      
      // heading
      const heading = create_h({
         level:'h1',
         text:'Files'
      })
      // outcome notification
      const files_outcome = create_div({
         classlist:['bg_lightgrey','mt_1','pl_1','pr_1'],
         attributes:[
            {key:'id',value:'files_outcome'}
         ]
      })
      const temp = create_div({
         text:this.#props ? this.#props.context.selected_folder : 'no folder selected'
      })


      // to do : open 'selected_folder' if provided - put in sep func - possible lib. func

      // if we have a provided 'selected_folder', we are coming 'back' from a Record, open the folder..
      if(this.#props) {
         if(this.#props.context) {
            if(this.#props.context.selected_folder) {
               
               // to do : do we need to prepend root_folder here?
               console.log('folder',this.#props.context.selected_folder)

               const files_list = await window.files_api.getFolderFilesList(this.#props.context.selected_folder)

               console.log('files_list',files_list)

               // returns array of file objects:
               // filename: "bellrock.jpg"
               // path: "C:\\wamp64\\www\\dev\\signal-tower-capture\\collection-dataset\\Research_A_G\\bell-rock-lighthouse"
               // type: "file"

               // to do : now display to UI

            }
         }
      }

      files_section.append(heading,temp,files_outcome)

      // get root_folder path
      // we only permit files under the Collection Root Folder
      // to do : verify file paths are in root folder

      let result = await window.config_api.getAppConfig()
      
      if(typeof result != "undefined") {
      
         if(result.outcome === 'success') {

            this.#root_folder = result.app_config.root_folder

            // root folder
            const root_sub_heading = create_h({
               level:'h4',
               text:this.#root_folder
            })

            // open folder
            const open_folder_btn = create_button({
               attributes:[
                  {key:'id',value:'open_folder_btn'}
               ],
               text:'Open Folder'
            })

            // 2-col layout
            const files_layout = create_div({
               classlist:['files_layout','m_0','p_0']
            })

            const file_list = create_div({
               attributes:[
                  {key:'id',value:'file_list'}
               ],
               classlist:['border','m_0','p_0.5','overflow_auto','max_h_24','text_sm','text_grey']
            })
            const file_view = create_div({
               attributes:[
                  {key:'id',value:'file_view'}
               ],
               classlist:['border'],
               text:''
            })

            files_layout.append(file_list,file_view)

            // assemble
            files_section.append(
               root_sub_heading,
               open_folder_btn,
               files_layout
            )
         }
         else {
            setTimeout(() => Notification.notify('files_outcome','Sorry, we couldn\'t locate the Collection Root Folder'),200)
         }
      }
      else {
         setTimeout(() => Notification.notify('files_outcome','Sorry, we couldn\'t locate the Collection Root Folder'),200)
      }
      return files_section
   }


   // enable buttons/links displayed in the render
   activate = () => {

      // open folder
      const open_folder_btn = document.getElementById('open_folder_btn')
      if(open_folder_btn) {

         open_folder_btn.addEventListener('click',async(event) => {

            const files_list = await window.files_api.openFolderDlg(this.#root_folder)
            
            if(files_list) {

               const file_list = document.getElementById('file_list')
               let list = create_ul({classlist:['flex','flex_col','gap_0.5','m_0','p_0']})
               let list_item

               // verify we are in Collections folders
               if(files_list[0].path.indexOf(this.#root_folder) === 0) { 

                  // build list of filenames (incs folders)
                  files_list.forEach(file => {

                     // assign folder_path to context remove the 'root_folder' part from path
                     this.#context.field_filters[0].value = file.path.replace(this.#root_folder,'')

                     if(file.type === 'file') {
                        list_item = create_li({
                           attributes:[
                              {key:'data-file-path',value:file.path + '\\' + file.filename},
                              {key:'data-file-name',value:file.filename}
                           ],
                           classlist:['folder_item','cursor_pointer','m_0','p_0'],
                           text:file.filename
                        })
                        list.append(list_item)
                     }
                  })
                  
                  // assemble
                  file_list.replaceChildren(list)
                  setTimeout(() => this.activate_file_links(),100)
                  
                  // we get list of 'folder_path' matching records w/ single db call
                  // rather than call db to check for each file we will check against this list
                  console.log('getting matching records',this.#context)
                  const result = await window.collection_items_api.getItems(this.#context)
                  this.#matching_records = result.collection_items
                  this.#record_fields = result.collection_item_fields
               }
               else {
                  // to do : notify not in the Collections folders (path doesn't include root_folder)
                  console.log('this is not on the root_folder path..')
               }
            }
         })
      }
   }


   // enable buttons/links displayed in the render
   activate_file_links = () => {
      // select file item
      const file_links = document.querySelectorAll('.folder_item')
      if(file_links) {

         file_links.forEach((file_link) => {

            file_link.addEventListener('click',async(event) => {
               const file_view = document.getElementById('file_view')

               let folder_path_filter = this.#context.field_filters.find(filter => filter.field = 'folder_path' )

               // to do : consider - esp. folder_path - is it bookended by '\\' or not? 
               //         we need a robust approach to handling this.. always trim before use?

               if(file_view) {
                  let props = {
                     context:this.#context,
                     file_name:event.target.getAttribute('data-file-name'),
                     file_path:event.target.getAttribute('data-file-path'),
                     folder_path:trim_end_char(folder_path_filter.value,'\\'),
                     find_matching_file_record:this.find_matching_file_record,
                     find_matching_folder_record:this.find_matching_folder_record,
                     get_record_fields:this.get_record_fields
                  }
                  const file_injector = new FileInjector(props)
                  file_view.replaceChildren(await file_injector.render())
                  setTimeout(() => file_injector.activate(),100)
               }
            })
         })
      }
   }

   // return first existing record for the filename
   find_matching_file_record = (filename) => {
      return this.#matching_records.find(item => item.file_name === filename)
   }

   // return first existing record for this folder flagged as a 'folder' item type
   find_matching_folder_record = (filename) => {
      return this.#matching_records.find(item => item.file_type.toUpperCase() === 'FOLDER')
   }

   get_record_fields = () => {
      return this.#record_fields
   }
}



export default Files