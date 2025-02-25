import { app } from '../renderer.js'
import PageBanner from '../components/PageBanner/PageBanner.js'
import FileInjector from '../components/FileInjector/FileInjector.js'
import BreadCrumbNav from '../components/BreadCrumbNav/BreadCrumbNav.js'
import ParentLink from '../components/ParentLink/ParentLink.js'
import Notification from '../components/Notification/Notification.js'
import { is_valid_response_obj } from '../utilities/ui_response.js'
import { trim_end_char } from '../utilities/ui_strings.js'
import { filetype_icon,no_root_folder,is_excluded_folder,get_parent_folder_path, no_root_elem } from '../utilities/ui_utilities.js'
import { create_section,create_div,create_ul,create_li } from '../utilities/ui_elements.js'


class FilesView {
   
   // the Collection Root Folder
   #root_folder = ''

   // find matching existing records in db
   #matching_records = []

   // list of fields inside a record
   #record_fields

   // we retain state by passing a 'context token'
   #context = {
      key:'Files',
      field_filters:[{field:'folder_path',value:''}],
      page:-1, // marks as no pagination 
      scroll_y:0
   }

   #breadcrumb_nav


   constructor(props) {
      if(props && props.context) this.#context = props.context
   }

   render = async() => {

      this.#root_folder = app.get_root_folder()
      if(this.#root_folder === '') return no_root_elem()

      const files_section = create_section({
         attributes:[{key:'id',value:'files_section'}],
         classlist:['h_85vh','mt_0','fit_content_height','pb_2']
      })

      const page_banner = new PageBanner({
         icon_name:'file_text',
         title:'Files',
         lead:'Browse all the files in the Collection Dataset folders.'
      })

      const notifications = create_div({
         attributes:[{key:'id',value:'notifications'}]
      })

      // 2-col layout
      const files_layout = create_div({
         classlist:['files_layout','m_0','p_0','h_100']
      })
      const file_list_elem = create_div({
         attributes:[{key:'id',value:'file_list_elem'}],
         classlist:['bg_white','box_shadow','rounded','m_0','p_1','overflow_auto','max_h_70','text_sm','text_grey']
      })
      const file_view = create_div({
         attributes:[{key:'id',value:'file_view'}],
         classlist:['bg_white','box_shadow','rounded','fit_content'],
         text:''
      })
      files_layout.append(file_list_elem,file_view)
                 
      this.#breadcrumb_nav = new BreadCrumbNav(this.open_folder)
      if(this.#breadcrumb_nav) setTimeout(() => this.#breadcrumb_nav.activate(),100)

      // hydrate w/ any rcvd context
      if(this.#context) {
         const folder_path_filter = this.#context ? this.#context.field_filters.find(filter => filter.field = 'folder_path' ) : ''

         // if we are coming 'back' from a Record, hydrate breadcrumb_nav, open the appropriate folder         
            this.#breadcrumb_nav.hydrate(this.#root_folder,folder_path_filter)
            if(this.#context) setTimeout(() => this.open_folder(folder_path_filter.value),100)    
      }

      window.scroll(0,0)
      
      // assemble
      files_section.append(
         page_banner.render(),
         notifications,
         this.#breadcrumb_nav.render(),
         files_layout
      )
      return files_section
   }

   // enable buttons/links displayed in the render
   activate = () => {      
      const parent_link_elem = document.getElementById('parent_link_elem')
      if(parent_link_elem) {
         parent_link_elem.addEventListener('click', (event) => {
            const link = event.target.getAttribute('data-parent-folder')
            this.open_folder(link)
         })
      }
   }

   // enable buttons/links displayed in the render

   activate_file_links = () => {
      // we display FileInjector for selected file (either existing record or create new)
      const file_links = document.querySelectorAll('.file_item')
      if(file_links) {
         file_links.forEach((file_link) => {
            file_link.addEventListener('click',async(event) => {

               const file_view = document.getElementById('file_view')
               const folder_path_filter = this.#context.field_filters.find(filter => filter.field = 'folder_path' )
               this.deselect_list_items()
               this.select_list_item(event.target)
               if(file_view) {
                  let injector_props = {
                     context:this.#context,
                     file_name:event.target.getAttribute('data-file-name'),
                     file_path:event.target.getAttribute('data-file-path'),
                     folder_path:trim_end_char(folder_path_filter.value,'\\'),
                     find_matching_file_record:this.find_matching_file_record,
                     find_matching_folder_record:this.find_matching_folder_record,
                     get_record_fields:this.get_record_fields,
                     refresh:this.refresh
                  }
                  const file_injector = new FileInjector(injector_props)
                  file_view.replaceChildren(await file_injector.render())
                  setTimeout(() => file_injector.activate(),100)
               }
            })
         })
      }
   }

   activate_folder_links = () => {
      const folder_items = document.querySelectorAll('.folder_item')
      if(folder_items) {
         folder_items.forEach((folder_item) => {
            folder_item.addEventListener('click',async(event) => {               
               // update page's context w/ selected folder (there are two props to consider)
               const history = app.get_service('history')
               if(history) {
                  history.augment_current_context({
                     field_filters:[{field:'folder_path',value:event.target.getAttribute('data-file-path').replace(this.#root_folder,'')}]
                  })
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
         // this.#context.page === -1, disabling pagination
         const result = await window.collection_items_api.getItems(this.#context)
         if(await is_valid_response_obj('read_collection_items',result)) {
            this.#matching_records = result.collection_items
            this.#record_fields = result.collection_item_fields
         }
      }
      catch(error) {
         setTimeout(() => Notification.notify('#notifications','Sorry, we failed to retrieve the list of matching records, so matches may be missed. You might want to try again later.',[],false),200)
      }
   }

   get_record_fields = () => {
      return this.#record_fields
   }

   open_folder = async(folder_path) => {
      if(folder_path === undefined || folder_path === null) folder_path = ''
      const files_list_obj = await window.files_api.getFolderFilesList(`${this.#root_folder}${folder_path}`)
      await this.hydrate(files_list_obj)
   }

   get_context_folder_path = () => {
      const folder_path_filter = this.#context.field_filters.find(filter => filter.field === 'folder_path')
      return folder_path_filter.value
   }

   refresh = async() => {
      await this.get_matching_records()
      this.open_folder(this.get_context_folder_path())
   }

   //
   // Hydrate page components with new folder_obj : {folder_name,files_list}
   //
   hydrate = async(folder_obj) => {
      const file_list_elem = document.getElementById('file_list_elem')
      const file_view = document.getElementById('file_view')
      const parent_link_obj = new ParentLink()

      if(folder_obj && folder_obj.files_list && folder_obj.files_list.length > 0) {

         let parent_folder_path = get_parent_folder_path(folder_obj.folder_name)
         let folders_sub_list = create_ul({classlist:['flex','no_wrap','flex_col','gap_0.5','m_0','p_0','pb_0.5']})
         let files_sub_list = create_ul({classlist:['flex','no_wrap','flex_col','gap_0.5','m_0','p_0','pb_0.5']})

         // escape spaces in target 'folder_path'
         const escaped_folder_path = folder_obj.files_list[0].path.split(/\ /).join('\ ')

         // verify we are in Collections folders
         if(escaped_folder_path.indexOf(this.#root_folder) === 0) {

            await this.get_matching_records()
            
            if(this.#breadcrumb_nav) {
               this.#breadcrumb_nav.hydrate(this.#root_folder,folder_obj.folder_name)
               setTimeout(() => this.#breadcrumb_nav.activate(),100)
            }

            // build list of filenames (incs folders)               
            // use for..of to facilitate 'await' call in code block
            for(const file of folder_obj.files_list) {

               let list_item
               
               
               // assign folder_path to context, remove the 'root_folder' part from path
               this.#context.field_filters[0].value = file.path.replace(this.#root_folder,'')

               // display Folders List
               if(file.type === 'dir') {
                  // don't add excluded_sub_folders
                  const is_excluded = await is_excluded_folder(file.path + '\\' + file.filename)

                  if(!is_excluded) {
                     list_item = create_li({
                        attributes:[
                           {key:'data-file-path',value:file.path + '\\' + file.filename},
                           {key:'data-file-name',value:file.filename}
                        ],
                        classlist:['flex','no_wrap','folder_item','cursor_pointer','m_0','p_0','text_blue'],
                        text: file.filename
                     })
                     list_item.prepend(filetype_icon('dir','',
                        [{key:'data-file-path',value:file.path + '\\' + file.filename},{key:'data-file-name',value:file.filename}]))
                     folders_sub_list.append(list_item)
                  }
               }
               // display Files List
               else if(file.type === 'file') {
                  
                  const new_file_icon = this.find_matching_file_record(file.filename)
                                          ?  ''
                                          :  'new_file'
                  list_item = create_li({
                     attributes:[
                        {key:'data-file-path',value:file.path + '\\' + file.filename},
                        {key:'data-file-name',value:file.filename}
                     ],
                     classlist:['flex','no_wrap','file_item','cursor_pointer','m_0','p_0','text_blue',new_file_icon],
                     text:file.filename
                  })
                  list_item.prepend(filetype_icon('file','',
                     [{key:'data-file-path',value:file.path + '\\' + file.filename},{key:'data-file-name',value:file.filename}]))
                  files_sub_list.append(list_item)
               }
            }
            file_list_elem.replaceChildren()

            // assemble
            if(file_list_elem) {               
               if(parent_folder_path.indexOf(this.#root_folder) === -1) {
                  file_list_elem.append(parent_link_obj.render(this.#root_folder,parent_folder_path,false))
               }
               else {
                  file_list_elem.append(parent_link_obj.render(this.#root_folder,parent_folder_path))
               }
               if(folders_sub_list.hasChildNodes()) file_list_elem.append(folders_sub_list)               
               if(files_sub_list.hasChildNodes()) file_list_elem.append(files_sub_list)               
            }

            if(!folders_sub_list.hasChildNodes() && !files_sub_list.hasChildNodes()) {
               let msg = create_div({text:'There are no files in this folder.'})
               if(file_list_elem) file_list_elem.replaceChildren(parent_link_obj.render(this.#root_folder,parent_folder_path,false),msg)
            }
            
            if(file_view) file_view.replaceChildren()
            setTimeout(() => this.activate_file_links(),100)
            setTimeout(() => this.activate_folder_links(),100)
            
            
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
               'notifications',
               `The folder you selected is not within the Collections Folders.`)
         }
      }
      else {

         if(folder_obj) {
            const folder_parent_path = get_parent_folder_path(folder_obj.folder_name)
            let msg = create_div({text:'There are no files in this folder.'})
            if(file_list_elem) file_list_elem.replaceChildren(parent_link_obj.render(this.#root_folder,folder_parent_path),msg)
            if(file_view) file_view.replaceChildren()

            if(this.#breadcrumb_nav && folder_obj) {
               this.#breadcrumb_nav.hydrate(this.#root_folder,folder_obj.folder_name)
               setTimeout(() => this.#breadcrumb_nav.activate(),100)
            }

            // activate
            this.activate_file_links()
            this.activate_folder_links()
            this.activate()
         }
      }
   }

   deselect_list_items = () => {
      const file_links = document.querySelectorAll('.file_item')
      if(file_links) {
         file_links.forEach((file_link) => file_link.style.background = 'none')
      }
   }
   select_list_item = (elem) => {
      if(elem) elem.style.background = '#DDDDDD'
   }
   
   get_default_context = () => {
      return this.#context
   }
}


export default FilesView