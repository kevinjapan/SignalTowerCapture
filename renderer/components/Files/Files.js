import FileInjector from '../FileInjector/FileInjector.js'
import BreadCrumbNav from '../BreadCrumbNav/BreadCrumbNav.js'
import Notification from '../Notification/Notification.js'
import {trim_end_char} from '../../utilities/ui_strings.js'
import {filetype_icon} from '../../utilities/ui_utilities.js'
import {create_section,create_h,create_div,create_button,create_ul,create_li} from '../../utilities/ui_elements.js'


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

   #breadcrumb_nav


   constructor(props) {
      if(props) this.#props = props
   }

   render = async() => {

      // container
      const files_section = create_section({
         attributes:[
            {key:'id',value:'files_section'}
         ]
      })      
      const heading = create_h({
         level:'h1',
         text:'Add a folder to the collection',
         classlist:['m_0']
      })
      const files_outcome = create_div({
         attributes:[
            {key:'id',value:'files_outcome'}
         ]
      })
      files_section.append(heading,files_outcome)

      // get root folder
      let result = await window.config_api.getAppConfig()
      
      if(typeof result != "undefined") {      
         if(result.outcome === 'success') {

            // retrieve and escape spaces in 'root_folder'
            let temp = result.app_config.root_folder
            this.#root_folder = temp.split(/\ /).join('\ ');

            // open folder btn
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

            // folder/file panels
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
            files_section.append(open_folder_btn)
                  
            this.#breadcrumb_nav = new BreadCrumbNav(this.open_folder)
            if(this.#breadcrumb_nav) {
               files_section.append(this.#breadcrumb_nav.render())
               setTimeout(() => this.#breadcrumb_nav.activate(),100)
            }

            // if we are coming 'back' from a Record,, hydrate breadcrumb_nav
            if(this.#props && this.#props.folder_path) {
               this.#breadcrumb_nav.hydrate(this.#root_folder,this.#props.folder_path)
            }
            else {
               // to do : show root_folder as base of breadcrumb - console.log('likely won\'t work')
               //this.#breadcrumb_nav.hydrate(this.#root_folder,this.#root_folder)
            }

            // if we are coming 'back' from a Record, open the appropriate folder
            if(this.#props) {
               if(this.#props.folder_path) {
                  setTimeout(() => this.open_folder(this.#props.folder_path),100)  
               }
            }
            else {
               setTimeout(() => this.open_folder(),100) 
            }

            files_section.append(files_layout)
         }
         else {
            setTimeout(() => Notification.notify('#files_outcome','Sorry, we couldn\'t locate the Collection Root Folder'),200)
         }
      }
      else {
         setTimeout(() => Notification.notify('#files_outcome','Sorry, we couldn\'t locate the Collection Root Folder'),200)
      }
      return files_section
   }

 
   // enable buttons/links displayed in the render
   //
   activate = () => {

      // open folder
      const open_folder_btn = document.getElementById('open_folder_btn')
      if(open_folder_btn) {

         open_folder_btn.addEventListener('click',async(event) => {
            const files_list = await window.files_api.openFolderDlg(this.#root_folder)
            if(files_list) this.hydrate(files_list)            
         })
      }
   }

   // enable buttons/links displayed in the render
   //
   activate_file_links = () => {

      // User clicks on a file in file_list element
      // we display FileInjector for that file (either existing record or create new)
      //
      const file_links = document.querySelectorAll('.file_item')
      if(file_links) {

         file_links.forEach((file_link) => {

            file_link.addEventListener('click',async(event) => {
               const file_view = document.getElementById('file_view')
               const folder_path_filter = this.#context.field_filters.find(filter => filter.field = 'folder_path' )

               // const path = event.target.getAttribute('data-file-path').replace(this.#root_folder,'')            
               // this.open_folder(path)
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

      // Use clicks on a folder in file_list element
      // we load that folder and display it's contents (sub-folders and files)
      //
      const folder_items = document.querySelectorAll('.folder_item')
      if(folder_items) {
         folder_items.forEach((folder_item) => {
            folder_item.addEventListener('click',async(event) => {
               const path = event.target.getAttribute('data-file-path').replace(this.#root_folder,'')            
               this.open_folder(path)
            })
         })
      }



   }

   // return first existing record for the filename
   find_matching_file_record = (filename) => {
      if(this.#matching_records) return this.#matching_records.find(item => item.file_name === filename)
      return null
   }

   // return first existing record for this folder flagged as a 'folder' item type
   find_matching_folder_record = () => {
      if(this.#matching_records) return this.#matching_records.find(item => item.file_type.toUpperCase() === 'FOLDER')
      return null
   }


   // to identify if we have an existing record for the selected file
   // we get a list of records matching 'folder_path' 
   // we perform a single db call and reference off of this list rather than querying each time
   get_matching_records = async() => {
      try {
         const result = await window.collection_items_api.getItems(this.#context)
         this.#matching_records = result.collection_items
         this.#record_fields = result.collection_item_fields
      }
      catch(error) {
         setTimeout(() => Notification.notify('#files_outcome','Sorry, we failed to retrieve the list of matching records, so matches may be missed. You might want to try again later.',[],false),200)
      }
   }

   get_record_fields = () => {
      return this.#record_fields
   }

   open_folder = async(folder_path) => {
      if(folder_path === undefined) folder_path = ''
      const files_list_obj = await window.files_api.getFolderFilesList(`${this.#root_folder}${folder_path}`)
      this.hydrate(files_list_obj)
   }

   //
   // Hydrate page components with new folder_obj : {folder_name,files_list}
   //
   hydrate = async(folder_obj) => {
              
      const file_list = document.getElementById('file_list')
      const file_view = document.getElementById('file_view')

      if(folder_obj.files_list && folder_obj.files_list.length > 0) {

         let list = create_ul({classlist:['flex','no_wrap','flex_col','gap_0.5','m_0','p_0']})

         // escape spaces in target 'folder_path'
         const escaped_folder_path = folder_obj.files_list[0].path.split(/\ /).join('\ ');

         // verify we are in Collections folders
         if(escaped_folder_path.indexOf(this.#root_folder) === 0) { 

            if(this.#breadcrumb_nav) {
               this.#breadcrumb_nav.hydrate(this.#root_folder,folder_obj.folder_name)
               setTimeout(() => this.#breadcrumb_nav.activate(),100)
            }

            // build list of filenames (incs folders)
            folder_obj.files_list.forEach(file => {

               let list_item

               // assign folder_path to context remove the 'root_folder' part from path
               this.#context.field_filters[0].value = file.path.replace(this.#root_folder,'')

               if(file.type === 'file') {
                  list_item = create_li({
                     attributes:[
                        {key:'data-file-path',value:file.path + '\\' + file.filename},
                        {key:'data-file-name',value:file.filename}
                     ],
                     classlist:['flex','no_wrap','file_item','cursor_pointer','m_0','p_0'],
                     text:file.filename
                  })
                  list_item.prepend(filetype_icon(file.filename,'file'))
                  list.append(list_item)
               }
               else if(file.type === 'dir') {
                  list_item = create_li({
                     attributes:[
                        {key:'data-file-path',value:file.path + '\\' + file.filename},
                        {key:'data-file-name',value:file.filename}
                     ],
                     classlist:['flex','no_wrap','folder_item','cursor_pointer','m_0','p_0'],
                     text:file.filename
                  })
                  list_item.prepend(filetype_icon(file.filename,'dir'))
                  list.append(list_item)
               }
            })

            // assemble
            if(list.hasChildNodes()) {
               if(file_list) file_list.replaceChildren(list)
            }
            else {
               let msg = create_div({text:'There are no files in this folder.'})
               if(file_list) file_list.replaceChildren(msg)
            }
            
            if(file_view) file_view.replaceChildren()
            setTimeout(() => this.activate_file_links(),100)
            
            await this.get_matching_records()
            
            // remove all event listeners
            // to prevent proliferation of dynamically assigned path links, then re-activate base element btns etc
            const files_section = document.getElementById('files_section')
            if(files_section) {

               // to do :     review this solution - workaround but may have issues - keep checking dev tools errors
               //             was an initial non-breaking error - but appears to have disappeared
               // replicate:  open 'jacobites' - open each pdf therein in descending order, then open 'Research_H_L'
               // error:      Refused to apply inline style ...
               // solution:   1 - use replaceChild() instead of innerHTML
               //             2 - may have to manage removeEventListeners ourselves
               files_section.innerHTML = files_section.innerHTML

               this.activate()
            }
         }
         else {
            Notification.notify(
               'files_outcome',
               `The folder you selected is not within the Collections Folders.`)
         }
      }
      else {
         let msg = create_div({text:'There are no files in this folder.'})
         if(file_list) file_list.replaceChildren(msg)
         if(file_view) file_view.replaceChildren()

         if(this.#breadcrumb_nav) {
            this.#breadcrumb_nav.hydrate(this.#root_folder,folder_obj.folder_name)
            setTimeout(() => this.#breadcrumb_nav.activate(),100)
         }

         // activate
         this.activate_file_links()
      }
   }

}



export default Files