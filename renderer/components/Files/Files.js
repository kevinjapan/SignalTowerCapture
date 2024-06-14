import { app } from '../../renderer.js'
import FileInjector from '../FileInjector/FileInjector.js'
import BreadCrumbNav from '../BreadCrumbNav/BreadCrumbNav.js'
import Notification from '../Notification/Notification.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import {trim_end_char} from '../../utilities/ui_strings.js'
import {filetype_icon,no_root_folder,is_excluded_folder} from '../../utilities/ui_utilities.js'
import {create_section,create_div,create_ul,create_li} from '../../utilities/ui_elements.js'


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
      field_filters:[{field:'folder_path',value:''}],
      page:-1, // marks as no pagination 
      scroll_y:0
   }

   #breadcrumb_nav


   constructor(props) {
      if(props) {
         this.#props = props
      }
      else {
         this.#props = {
            context:this.#context
         }
      }
   }

   render = async() => {

      this.#root_folder = await app.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()
      //this.#root_folder = temp.split(/\ /).join('\ ');

      // container
      const files_section = create_section({
         attributes:[{key:'id',value:'files_section'}],
         classlist:['h_85vh','mt_0','fit_content_height','pb_2']
      })

      // notifications
      const files_outcome = create_div({
         attributes:[{key:'id',value:'files_outcome'}]
      })
      files_section.append(files_outcome)

      // 2-col layout
      const files_layout = create_div({
         classlist:['files_layout','m_0','p_0','h_100']
      })

      // folder/file panels
      const file_list_elem = create_div({
         attributes:[{key:'id',value:'file_list_elem'}],
         classlist:['bg_white','box_shadow','rounded','m_0','p_0.5','overflow_auto','h_80','text_sm','text_grey']
      })
      const file_view = create_div({
         attributes:[{key:'id',value:'file_view'}],
         classlist:['bg_white','box_shadow','rounded','fit_content'],
         text:''
      })

      files_layout.append(file_list_elem,file_view)

      // assemble                  
      this.#breadcrumb_nav = new BreadCrumbNav(this.open_folder)
      if(this.#breadcrumb_nav) {
         files_section.append(this.#breadcrumb_nav.render())
         setTimeout(() => this.#breadcrumb_nav.activate(),100)
      }

      // hydrate w/ any rcvd context
      if(this.#props && this.#props.context) {
         const folder_path_filter = this.#props ? this.#props.context.field_filters.find(filter => filter.field = 'folder_path' ) : ''

         // if we are coming 'back' from a Record, hydrate breadcrumb_nav
         if(this.#props && this.#props.context) {
            this.#breadcrumb_nav.hydrate(this.#root_folder,folder_path_filter)
         }
         // if we are coming 'back' from a Record, open the appropriate folder
         if(this.#props) {
            if(this.#props.context) {
               setTimeout(() => this.open_folder(folder_path_filter.value),100)  
            }
         }
         else {
            setTimeout(() => this.open_folder(),100) 
         }
      }

      window.scroll(0,0)
      
      files_section.append(files_layout)
      return files_section
   }

   // enable buttons/links displayed in the render
   activate = () => {}


   //
   // enable buttons/links displayed in the render
   //

   activate_file_links = () => {

      // User clicks on a file in file_list_elem
      // we display FileInjector for that file (either existing record or create new)
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
   }

   activate_folder_links = () => {

      // User clicks on a folder in file_list_elem
      // we load that folder and display it's contents (sub-folders and files)
      const folder_items = document.querySelectorAll('.folder_item')
      if(folder_items) {
         folder_items.forEach((folder_item) => {


            folder_item.addEventListener('click',async(event) => {
               
               // update page's context w/ selected folder (there are two props to consider)
               const history = app.get_service('history')
               if(history) {
                  console.log(event.target)
                  history.augment_current_context(
                     {
                        folder_path:event.target.getAttribute('data-file-path').replace(this.#root_folder,'')
                     }
                  )
                  history.augment_current_context(
                     {
                        field_filters:[{field:'folder_path',value:event.target.getAttribute('data-file-path').replace(this.#root_folder,'')}]
                     }
                  )
               }

               // update filter
               const folder_path_filter = this.#context.field_filters.find(filter => filter.field = 'folder_path' )
               folder_path_filter.value = event.target.getAttribute('data-file-path').replace(this.#root_folder,'')               

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

   // Do we have an existing record for the selected file?
   // we perform a single db call and reference off of this list rather than querying each time
   get_matching_records = async() => {
      try {
         // this.#context.page is -1 - disabling pagination
         const result = await window.collection_items_api.getItems(this.#context) 
         if(await is_valid_response_obj('read_collection_items',result)) {
            this.#matching_records = result.collection_items
            this.#record_fields = result.collection_item_fields
         }
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

   // Hydrate page components with new folder_obj : {folder_name,files_list}
   hydrate = async(folder_obj) => {
              
      const file_list_elem = document.getElementById('file_list_elem')
      const file_view = document.getElementById('file_view')

      if(folder_obj.files_list && folder_obj.files_list.length > 0) {

         let folders_sub_list = create_ul({classlist:['flex','no_wrap','flex_col','gap_0.5','m_0','p_0','pb_0.5']})
         let files_sub_list = create_ul({classlist:['flex','no_wrap','flex_col','gap_0.5','m_0','p_0','pb_0.5']})

         // escape spaces in target 'folder_path'
         const escaped_folder_path = folder_obj.files_list[0].path.split(/\ /).join('\ ');

         // verify we are in Collections folders
         if(escaped_folder_path.indexOf(this.#root_folder) === 0) {
            if(this.#breadcrumb_nav) {
               this.#breadcrumb_nav.hydrate(this.#root_folder,folder_obj.folder_name)
               setTimeout(() => this.#breadcrumb_nav.activate(),100)
            }

            // build list of filenames (incs folders)               
            // use for..of to facilitate 'await' call in code block
            for(const file of folder_obj.files_list) {

               let list_item
               
               // assign folder_path to context remove the 'root_folder' part from path
               this.#context.field_filters[0].value = file.path.replace(this.#root_folder,'')

               // Display Files List
               if(file.type === 'file') {
                  list_item = create_li({
                     attributes:[
                        {key:'data-file-path',value:file.path + '\\' + file.filename},
                        {key:'data-file-name',value:file.filename}
                     ],
                     classlist:['flex','no_wrap','file_item','cursor_pointer','m_0','p_0','text_lg','text_blue'],
                     text:file.filename
                  })
                  list_item.prepend(filetype_icon('file','',
                     [{key:'data-file-path',value:file.path + '\\' + file.filename},{key:'data-file-name',value:file.filename}]))
                  files_sub_list.append(list_item)
               }
               // Display Folders List
               else if(file.type === 'dir') {

                  // don't add excluded sub_folders
                  const is_excluded = await is_excluded_folder(file.path + '\\' + file.filename)

                  if(!is_excluded) {
                     list_item = create_li({
                        attributes:[
                           {key:'data-file-path',value:file.path + '\\' + file.filename},
                           {key:'data-file-name',value:file.filename}
                        ],
                        classlist:['flex','no_wrap','folder_item','cursor_pointer','m_0','p_0','text_lg','text_blue'],
                        text: file.filename
                     })
                     list_item.prepend(filetype_icon('dir','',
                        [{key:'data-file-path',value:file.path + '\\' + file.filename},{key:'data-file-name',value:file.filename}]))
                     folders_sub_list.append(list_item)
                  }
               }
            }
            file_list_elem.replaceChildren()

            // assemble
            if(folders_sub_list.hasChildNodes()) {
               if(file_list_elem) file_list_elem.append(folders_sub_list)
            }
            if(files_sub_list.hasChildNodes()) {
               if(file_list_elem) file_list_elem.append(files_sub_list)
            }
            if(!folders_sub_list.hasChildNodes() && !files_sub_list.hasChildNodes()) {
               let msg = create_div({text:'There are no files in this folder.'})
               if(file_list_elem) file_list_elem.replaceChildren(msg)
            }
            // file_list_elem.prepend(icon('arrow_up'))
            
            if(file_view) file_view.replaceChildren()
            setTimeout(() => this.activate_file_links(),100)
            setTimeout(() => this.activate_folder_links(),100)
            
            await this.get_matching_records()
            
            // remove all event listeners
            // to prevent proliferation of dynamically assigned path links, then re-activate base element btns etc
            const files_section = document.getElementById('files_section')
            if(files_section) {
               // flush all event listeners
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
         if(file_list_elem) file_list_elem.replaceChildren(msg)
         if(file_view) file_view.replaceChildren()

         if(this.#breadcrumb_nav) {
            this.#breadcrumb_nav.hydrate(this.#root_folder,folder_obj.folder_name)
            setTimeout(() => this.#breadcrumb_nav.activate(),100)
         }

         // activate
         this.activate_file_links()
         this.activate_folder_links()
      }
   }
   
   get_default_context = () => {
      return this.#context
   }
   
}


export default Files