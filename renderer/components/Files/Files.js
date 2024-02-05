import FileInjector from '../FileInjector/FileInjector.js'
import Notification from '../Notification/Notification.js'
import {trim_char} from '../../utilities/ui_strings.js'
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

   // we retain browse state (page,scroll_y,etc) by passing a 'context token'
   #context = {
      key:'Files',
      field_filters:[
         {field:'folder_path',value:''}
      ],
      page:1,
      scroll_y:0
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
      files_section.append(heading,files_outcome)


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
               classlist:['border','m_0','p_0']
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
               let list = create_ul({classlist:['flex','flex_col','gap_1','m_0','p_0']})
               let list_item

               // verify we are in Collections folders
               if(files_list[0].path.indexOf(this.#root_folder) === 0) { 

                  // build list of filenames (incs folders)
                  files_list.forEach(file => {

                     // assign folder_path to context remove the 'root_folder' part from path
                     this.#context.field_filters[0].value = file.path.replace(this.#root_folder,'')

                     list_item = create_li({
                        attributes:[
                           {key:'data-file-path',value:file.path + '\\' + file.filename},
                           {key:'data-file-name',value:file.filename}
                        ],
                        classlist:['folder_item','cursor_pointer','m_0','p_0'],
                        text:file.type + ' ' + file.filename
                     })
                     list.append(list_item)
                  })
                  
                  // assemble
                  file_list.replaceChildren(list)
                  setTimeout(() => this.activate_file_links(),100)
                  
                  // we get list of 'folder_path' matching records w/ single db call
                  // rather than call db to check for each file we will check against this list
                  const result = await window.collection_items_api.getItems(this.#context)
                  this.#matching_records = result.collection_items
                  this.#record_fields = result.collection_item_fields

                  console.log('this.#matching_records',this.#matching_records)
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

               // to do : field_filters is an array
               console.log('this.#context.field_filters.folder_path',this.#context.field_filters.folder_path)

               let folder_path_filter = this.#context.field_filters.find(filter => filter.field = 'folder_path' )

               console.log('folder_path_filter',folder_path_filter)

               if(file_view) {
                  let props = {
                     file_name:event.target.getAttribute('data-file-name'),
                     file_path:event.target.getAttribute('data-file-path'),
                     folder_path:trim_char(folder_path_filter.value,'\\'),
                     find_matching_record:this.find_matching_record,
                     get_record_fields:this.get_record_fields
                  }
                  // to do : check against this.#matching_records - 
                  //         do we already have a record for this file?
                  //         may require callback func to FileInjector ?

                  const file_injector = new FileInjector(props)
                  file_view.replaceChildren(await file_injector.render())
                  setTimeout(() => file_injector.activate(),100)
               }
            })
         })
      }
   }

   find_matching_record = (filename) => {
      return this.#matching_records.find(item => item.file_name === filename)
   }
   get_record_fields = () => {
      return this.#record_fields
   }
}



export default Files