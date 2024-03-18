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
      if(props) this.#props = props
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
         text:'Add a folder to the collection',
         classlist:['m_0']
      })
      // outcome notification
      const files_outcome = create_div({
         attributes:[
            {key:'id',value:'files_outcome'}
         ]
      })
      const folder_selected = create_div({
         attributes:[
            {key:'id',value:'folder_selected'},
         ],
         classlist:['p_1'],
         text:this.#props ? this.#props.folder_path : 'Please select a folder.'
      })

      files_section.append(heading,files_outcome)

      let result = await window.config_api.getAppConfig()
      
      if(typeof result != "undefined") {      
         if(result.outcome === 'success') {

            this.#root_folder = result.app_config.root_folder

            // root folder
            const root_sub_heading = create_h({
               level:'h5',
               text:'Root folder: ' + this.#root_folder
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
               folder_selected,
               files_layout
            )
            
            // if we have a provided 'selected_folder', we are coming 'back' from a Record, open the folder..
            if(this.#props) {
                  if(this.#props.folder_path) {

                     const files_list = await window.files_api.getFolderFilesList(`${this.#root_folder}${this.#props.folder_path}`)

                     if(files_list) {
                        let list = create_ul({classlist:['flex','flex_col','gap_0.5','m_0','p_0']})
                        let list_item
                        files_list.forEach(file => {

                           // assign folder_path to context, removing the 'root_folder' part
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

                        // get our reference matching records
                        await this.get_matching_records()
                     }
                  }
               
            }
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

 

   //
   // enable buttons/links displayed in the render
   //
   activate = () => {

      // open folder
      const open_folder_btn = document.getElementById('open_folder_btn')
      if(open_folder_btn) {

         open_folder_btn.addEventListener('click',async(event) => {
            const files_list = await window.files_api.openFolderDlg(this.#root_folder)
            this.display_file_list(files_list)            
         })
      }
   }

   
   display_file_list = async(files_list) => {

      const folder_selected = document.getElementById('folder_selected')
               
      if(files_list) {

         const file_list = document.getElementById('file_list')
         const file_view = document.getElementById('file_view')
         let list = create_ul({classlist:['flex','flex_col','gap_0.5','m_0','p_0']})
         let list_item

         // verify we are in Collections folders
         if(files_list[0].path.indexOf(this.#root_folder) === 0) { 

            // build list of filenames (incs folders)
            files_list.forEach(file => {

               // assign folder_path to context remove the 'root_folder' part from path
               this.#context.field_filters[0].value = file.path.replace(this.#root_folder,'')
               if(folder_selected) folder_selected.innerText = file.path.replace(this.#root_folder,'')

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
            if(file_list) file_list.replaceChildren(list)
            if(file_view) file_view.replaceChildren()
            setTimeout(() => this.activate_file_links(),100)
            
            await this.get_matching_records()
         }
         else {
            Notification.notify(
               'files_outcome',
               `The folder you selected is not within the Collections Folders.`)
         }
      }
   }


   //
   // enable buttons/links displayed in the render
   //
   activate_file_links = () => {
      // select file item
      const file_links = document.querySelectorAll('.folder_item')
      if(file_links) {

         file_links.forEach((file_link) => {

            file_link.addEventListener('click',async(event) => {

               const file_view = document.getElementById('file_view')
               const folder_path_filter = this.#context.field_filters.find(filter => filter.field = 'folder_path' )

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

   //
   // get list of records matching 'folder_path' 
   // we perform single db call and reference off of this rather than querying each time
   //
   get_matching_records = async() => {
      try {
         const result = await window.collection_items_api.getItems(this.#context)
         this.#matching_records = result.collection_items
         this.#record_fields = result.collection_item_fields
      }
      catch(error) {
         // to do : handle error.
         console.log('Failed to retrieve list of matching records.')
      }
   }

   get_record_fields = () => {
      return this.#record_fields
   }

}



export default Files