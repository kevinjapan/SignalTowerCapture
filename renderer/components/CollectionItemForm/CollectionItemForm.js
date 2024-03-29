import App from '../App/App.js'
import FormBtns from '../FormBtns/FormBtns.js'
import Notification from '../../components/Notification/Notification.js'
import { DESC } from '../../utilities/ui_descriptions.js'
import { ui_friendly_text,trim_char,trim_end_char } from '../../utilities/ui_strings.js'
import { is_img_ext,get_file_type_icon,file_exists,build_img_elem } from '../../utilities/ui_utilities.js'
import { create_section,create_div,create_form,create_label,create_button,create_input,
         create_textarea,create_checkbox_fieldset,create_radio_fieldset} from '../../utilities/ui_elements.js'


// all our input validation is carried out in the main process in window.collection_items_api.updateCollectionItem()
// any errors are returned from the same api function on failure



class CollectionItemForm {

   // the collection item record id 
   // the FormData will not contain this since we only expose 'editable' fields in the UI form
   #record_id

   // the collection item record
   #record

   // Props
   // fields, item, [context]
   // 'props.fields' preserves the display order
   #props

   // tags object 
   // containing tags fields list and config registered tags
   #tags_obj

   // Collection root folder
   #root_folder = ''

   #submit_enabled = true


   constructor(props) {
      this.#props = props
 
   }


   render = async() =>  {
     
      // get root_folder
      const app_config_obj = await window.config_api.getAppConfig()
      if(app_config_obj.outcome === 'success') {
         this.#root_folder = trim_end_char(app_config_obj.app_config.root_folder,'\\')                 
      }

      // component container
      this.#record = create_section({
         classlist:['collection_item_record']
      })

      // 2-col layout
      let text_col = create_div({
         classlist:['text_col','pl_1']
      })
      let img_col = create_div({
         attributes:[
            {key:'id',value:'img_col'}
         ],
         classlist:['img_col']
      })

      // form & layout - inside text_col
      let form = create_form({
         attributes:[
            {key:'id',value:'item_form'}
         ],
         classlist:['form_layout']
      })
      
      let submit_outcome = create_section({
         attributes:[
            {key:'id',value:'submit_outcome'}
         ]
      })

      // we don't inc cancel btn in 'new' record forms
      const inc_cancel = this.#props.action === 'add' ? false : true

      let btn_group_1 = FormBtns.render(this.#props.item,inc_cancel)
      form.append(create_div(),btn_group_1,create_div(),submit_outcome)
      text_col.append(form)
      

      // form_layout is grid inside text_col
      // we build each form field row(s) in parent grid as:
      //    |  field_label  |   field_input   |
      //    |               |   field_error   |
      //    |               | [find_file_btn] |

      this.#props.fields.forEach( async(field) => {

         // get the value for the current form field
         let curr_field_value = ''
         if(typeof this.#props.item !== 'undefined') curr_field_value = this.#props.item[field.key]
         if(curr_field_value === null) curr_field_value = ''
         if(field.key === 'file_type' && curr_field_value === '') curr_field_value = 'File'
      
         // build the row label
         let field_label = create_label({
            attributes:[
               {key:'for',value:field.key}
            ],
            text:ui_friendly_text(field.key)
         })

         // build the row input field
         let field_input

         if(field.test.type === 'string' && field.test.max > 120) {
            field_input = create_textarea({
               attributes:[
                  {key:'id',value:field.key},
                  {key:'name',value:field.key},
                  {key:'type',value:'text'},
                  {key:'value',value:curr_field_value},
                  {key:'maxlength',value:field.test.max},
                  {key:'readonly',value:field.readonly ? 'readonly' : false},
               ],
               classlist:['input_field']
            })
            if(field.hidden === true) field_input.hidden = true
            field_input.value = curr_field_value   // req for textareas
            field_input.style.height = field.test.max > 200 ? '16rem' : '4.25rem'
            if(field.placeholder) field_input.setAttribute('placeholder',field.placeholder)
            if(!field.editable) field_input.disabled = 'disabled'
         }
         else {
            field_input = create_input({
               attributes:[
                  {key:'id',value:field.key},
                  {key:'name',value:field.key},
                  {key:'type',value:'text'},
                  {key:'value',value:curr_field_value},
                  {key:'maxlength',value:field.test.max},
                  {key:'readonly',value:field.readonly ? 'readonly' : false},
               ],
               classlist:['input_field']
            })
            if(field.hidden === true) field_input.hidden = true
            if(field.placeholder) field_input.setAttribute('placeholder',field.placeholder)
            if(!field.editable) field_input.disabled = 'disabled'
         }

         // build the row error notification
         let field_error = create_div({
            attributes:[
               {key:'id',value:`${field.key}_error`}
            ],
            classlist:['error_bar','bg_yellow']
         })

         // build the row stats
         let field_stats = create_div({
            classlist:['field_info'],
            text:`max ${field.test.max} chars`
         })

         // assemble add current row to form grid

         if(field.hidden !== true) form.append(field_label)
         form.append(field_input)

         if(field.editable && field.hidden !== true) form.append(create_div(),field_stats)

         form.append(create_div(),field_error)

         
         // tags checkboxes
         if(field.key === 'tags') {

            let field_label = create_label({
               attributes:[
                  {key:'for',value:field.key}
               ],
               text:ui_friendly_text(field.key)
            })

            // current tags : this.#props.item[field.key]
            const current_tags = this.#props.item ?
                  this.#props.item[field.key] ? this.#props.item[field.key].split(',') : []
                  : []

            // placeholder - we inject once promise is resolved..
            form.append(field_label,create_div({attributes:[{key:'id',value:'tags_placeholder'}]}))

            try {
               this.#tags_obj = await window.tags_api.getTags(this.#props.context ? this.#props.context : {})

               if (typeof this.#tags_obj != "undefined") {
            
                  if(this.#tags_obj.outcome === 'success') {

                     // get existing tags list (remove any non-registered tag tokens)
                     const verified_curr_tags = current_tags.filter(curr_tag => {
                        return this.#tags_obj.tags.some(tag => tag.tag === curr_tag)
                     })

                     const tags_checks = this.#tags_obj.tags.map(tag => {
                        return {
                           key:tag.tag,
                           value:tag.tag,
                           checked: verified_curr_tags.some(current_tag => {
                              return tag.tag === current_tag
                           }) ? 'checked' : null
                        }
                     })

                     const tags_checkboxes = create_checkbox_fieldset({
                        name:'tags_checkbox',
                        checkboxes:tags_checks
                     })
                     tags_placeholder.replaceChildren(create_div(),tags_checkboxes)
                  }
                  // we activate tags separately to tie activation to completion of getTags()
                  this.activate_tags()
               }
            }
            catch(error) {
               setTimeout(() => Notification.notify('#tags_placeholder','Sorry, we were unable to access the Tags.',false),1500)
            }
         }

         
         // file_type checkboxes
         if(field.key === 'file_type') {

            let field_label = create_label({
               attributes:[
                  {key:'for',value:field.key}
               ],
               text:ui_friendly_text(field.key)
            })

            const file_type_radio = create_radio_fieldset({
               name:'file_type_radio_btns',
               classlist:['m_0'],
               radio_buttons:[
                  {key:'file',label:'Single PDF,JPG or other file',value:'File',checked:curr_field_value.toUpperCase() === 'FILE' ? true : false},
                  {key:'folder',label:'Folder of multiple PDF,JPG or other files',value:'Folder',checked:curr_field_value.toUpperCase() === 'FOLDER' ? true : false}
               ]
            })
            
            const file_type_info = create_div({
               attributes:[
                  {key:'id',value:'file_type_info'}
               ],
               classlist:['text_grey','border','rounded','mb_3','p_1'],
               text:curr_field_value.toUpperCase() === 'FILE' ? DESC.FILE_ITEM_FILETYPE : DESC.FOLDER_ITEM_FILETYPE
            })

            form.append(field_label,file_type_radio,create_div(),file_type_info)

            let find_file_outcome = create_div({
               attributes:[
                  {key:'id',value:'find_file_outcome'}
               ]
            })

            // btn to select file for 'file_name' field
            let find_file_btn = create_button({
               attributes:[
                  {key:'id',value:'find_file_btn'}
               ],
               classlist:['form_btn'],
               text:'Find File'
            }) 
            // assemble find_file
            form.append(create_div(),find_file_btn,create_div(),find_file_outcome)
         }

         // display the file if it's a valid img and it exists
         if(field.key === 'file_name' && this.#props.item) {
            let relative_folder_path = this.#props.item['folder_path']
            let file_path = `${this.#root_folder}\\${relative_folder_path}\\${this.#props.item[field.key]}`
            await this.display_image_or_filetype(img_col,file_path,this.#props.item['img_desc'])
         }
      })

      if(typeof this.#props.item !== 'undefined') {
         this.#record_id = this.#props.item.id
      }

      let btn_group_2 = FormBtns.render(this.#props.item,inc_cancel)

      // assemble
      form.append(create_div(),btn_group_2)
      this.#record.append(img_col,text_col)

      window.scroll(0,0)

      return this.#record
   }


   // hydrate w/ known field values
   //
   hydrate = (field_values) => {

      let elem = null

      field_values.forEach((field_value) => {

         if(field_value.field === 'img') {
            let img_col = document.getElementById('img_col')
            if(img_col) {
               this.display_image_or_filetype(img_col,field_value.value,field_value.alt)
            }
         }
         elem = document.getElementById(field_value.field)
         if(elem) {
            elem.value = field_value.value
         }
      })
   }


   // enable buttons/links displayed in the render
   //
   activate = () => {

      // On 'Apply' add or update CollectionItemForm

      const apply_btns = document.querySelectorAll('.apply_btn')

      if(apply_btns) {

         apply_btns.forEach((apply_btn) => {
            if(this.#props.action === 'add') {               
               apply_btn.innerText = 'Submit'
            }
            else {               
               apply_btn.innerText = 'Update'
            }

            apply_btn.addEventListener('click',async(event) => {

               event.preventDefault()
               if(this.#submit_enabled === false) return
               this.clear_errors()

               Notification.notify('#submit_outcome',``)

               const item_form = document.getElementById('item_form')
               if(item_form) {

                  // since we are dynamically generating form elements (hence we don't know what they are here)
                  // we validate inputs in the main process (good enough given this is a closed desktop app) 

                  // build the updated_collection_item 
                  const form_data = new FormData(item_form)
                  let updated_collection_item = {}
                  for(const pair of form_data.entries()) {
                     // we don't escape_html since we never user innerHTML
                     updated_collection_item[pair[0]] = pair[1].trim()
                  }

                  let response
                  if(this.#props.action === 'add') {
                     response = await window.collection_items_api.addCollectionItem(updated_collection_item)
                  }
                  else {
                     // FormData only returns the non-disabled input key/value pairs - so we have to add 'id'
                     updated_collection_item.id = this.#record_id
                     response = await window.collection_items_api.updateCollectionItem(updated_collection_item)
                  }

                  if(response.outcome === 'success') {
                     
                     try {
                        let collection_item_id = response.collection_item.id
                        
                        const collection_item_obj = await window.collection_items_api.getCollectionItem(collection_item_id)

                        if (typeof collection_item_obj != "undefined") {
                           if(collection_item_obj.outcome === 'success') {
                              this.#props.item = collection_item_obj.collection_item
                              App.switch_to_component('Record',this.#props)
                           }
                        }
                     }
                     catch(error) {
                        let props = {
                           msg:'Sorry, we were unable to locate the Record.',
                           error:error
                        }
                        App.switch_to_component('Error',props)
                     }
                  }
                  else {
                     // highlight errors on ui
                     if(Array.isArray(response.errors)) {
                        this.highlight_errors(response.errors)

                        // ensure highlighted errors are visible
                        const first_active_error = document.getElementsByClassName('active_error')[0]
                        if(first_active_error) {
                           first_active_error.scrollIntoView({ block: "center" })
                        }

                     }
                  }               
               }
            })
         })

         const title_input = document.getElementById('title')
         if(title_input) title_input.focus()

      }

   
      // On 'Cancel' return to the CollectionItemRecord for same record
      const cancel_btns = document.querySelectorAll('.cancel_btn')
      
      if(cancel_btns) {

         cancel_btns.forEach((cancel_btn) => {

            cancel_btn.addEventListener('click',async(event) => {
               
               event.preventDefault()
               
               if(typeof cancel_btn.attributes['data-id'] !== 'undefined') {

                  try {
                     const collection_item_obj = await window.collection_items_api.getCollectionItem(cancel_btn.attributes['data-id'].value)

                     if (typeof collection_item_obj != "undefined") {
                        if(collection_item_obj.outcome === 'success') {
                           App.switch_to_component('Record',this.#props)
                        }
                        else {
                           let props = {error:'Sorry, we were unable to locate the Record.'}
                           App.switch_to_component('Error',props)
                        }
                     }
                     else {
                        throw 'Sorry, we were unable to locate the Record.'
                     }
                  }
                  catch(error) {
                     let props = {
                        msg:'Sorry, we were unable to locate the Record.',
                        error:error
                     }
                     App.switch_to_component('Error',props)
                  }
               }
               else {
                  let props = {
                     msg:'Sorry, we were unable to locate the Record.'
                  }
                  App.switch_to_component('Error',props)
               }
            })
         })
      }

   
      // On 'Find File' select w/ dialog
      const find_file_btn = document.getElementById('find_file_btn')

      if(find_file_btn) {

         find_file_btn.addEventListener('click',async(event) => {
            
            event.preventDefault()    
            const sep = await window.files_api.filePathSep()  
            
            const result = await window.files_api.getFilePath()
      
            if(result.outcome === 'success') {

               // inject appropriate into file_name and folder_path inputs
               let full_path = result.files[0]
               let separator = full_path.lastIndexOf(sep)
               let path = full_path.substring(0,separator)
               let file = full_path.substring(separator + 1)

               let file_name_input = document.getElementById('file_name')
               if(file_name_input) {
                  file_name_input.value = file
               }
               
               let folder_path = document.getElementById('folder_path')
               if(folder_path) {
                  if(path.indexOf(this.#root_folder) === 0) {                        
                     folder_path.value = path.replace(this.#root_folder,'') // relative path
                  }
                  else {
                     this.disable_submit()
                     Notification.notify('#find_file_outcome',`Invalid location - the folder you selected is not within the Collections Folders.`,[],false)
                     return
                  }
               }
               
               // auto-gen candidate title from the file name if non-exists
               let title = document.getElementById('title')
               if(title) {
                  if(title.value === '') {
                     let temp = file_name_input.value
                     let candidate = temp.substring(0,temp.length - 4).replaceAll('-',' ')
                     candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1)             
                     title.value = candidate
                  }
               }

               // display if new file is an img file
               let file_path = `${path}\\${file}`
               await this.display_image_or_filetype(img_col,file_path,this.#props.item ? this.#props.item['img_desc'] : 'image')

               // Is there an existing record for the selected file?
               let context = {
                  page:1,
                  field_filters:[
                     {field:'file_name',value:file},
                     {field:'folder_path',value:path.replace(this.#root_folder,'')}]
               }

               try {
                  const collection_items_obj = await window.collection_items_api.getItems(context)                  

                  if (typeof collection_items_obj != "undefined") {            
                     if(collection_items_obj.outcome === 'success') {
                        
                        if(collection_items_obj.collection_items.length < 1) {
                           // There is no record for this file
                           this.enable_submit()
                           Notification.notify('#find_file_outcome',`This file is valid.`,['bg_inform'],false)
                        }
                        else {
                           // There is an existing record for this file
                           if(this.#props.action === 'update') {

                              // Is existing record the same record we are currently editing
                              const existing_record_id = collection_items_obj.collection_items[0].id
                              const current_record_id = this.#props.item.id
                              if(parseInt(existing_record_id) === parseInt(current_record_id)) {
                                 // same record, we are changing file to a valid alternative (no existing record for new file)
                                 this.enable_submit()
                                 Notification.notify('#find_file_outcome',`This file is valid.`,['bg_inform'],false)
                              }
                              else {
                                 // match is for a record other than the one we are editing
                                 this.disable_submit()
                                 Notification.notify('#find_file_outcome',`Invalid file - there is already a record for this file.`,[],false)
                              }
                           }
                           else {
                              this.disable_submit()
                              Notification.notify('#find_file_outcome',`Invalid file - there is already a record for this file.`,[],false)
                           }
                        }
                     }
                     else {
                        throw 'No records were returned.' + collection_items_obj.message
                     }
                  }
                  else {
                     throw 'No records were returned.'
                  }
               }
               catch(error) {
                  let props = {
                     msg:'Sorry, we were unable to access the Records.',
                     error:error
                  }
                  App.switch_to_component('Error',props)
               }
            }
            else {
               Notification.notify('#find_file_outcome',result.message)
            }
         })
      }


      // On file_name change, we display the new file if img and exists
      //
      const file_name = document.getElementById('file_name')
      const folder_path = document.getElementById('folder_path')
      const img_col = document.getElementById('img_col')
      if(file_name && folder_path && img_col) {            
         file_name.addEventListener('change',async(event) => {
            let file_path = `${folder_path.value}\\${file_name.value}`
            await this.display_image_or_filetype(img_col,file_path,this.#props.item ? this.#props.item['img_desc'] : 'image')
         })
      }


      // On change file_type radio btn
      //
      const file_type_radio_btns = document.querySelectorAll('input[name="file_type_radio_btns"]')
      if(file_type_radio_btns) {
         file_type_radio_btns.forEach((radio_btn) => {            
            radio_btn.addEventListener('change',(event) => {
               
               const file_type = document.getElementById('file_type')
               if(file_type) {
                  file_type.value = event.target.value
               }           
               
               const file_type_info = document.getElementById('file_type_info')
               if(file_type_info) {
                  file_type_info.innerText = event.target.value === 'File' ? DESC.FILE_ITEM_FILETYPE : DESC.FOLDER_ITEM_FILETYPE
               }
            })
         })
      }
   }


   activate_tags = () => {
      
      // On change tag checkbox
      const tags_checkboxes = document.querySelectorAll('.tags_checkbox')

      if(tags_checkboxes) {

         tags_checkboxes.forEach(checkbox => {

            checkbox.addEventListener('change',(event) => {

               const tags_input = document.getElementById('tags')
               if(tags_input) {

                  // get existing tags list (remove any non-registered tag tokens)
                  const curr_tags = tags_input.value.split(',').filter(e => e)
                  const verified_curr_tags = curr_tags.filter(curr_tag => {
                     return this.#tags_obj.tags.some(tag => tag.tag === curr_tag)
                  })
                  const existing_tags = new Set(verified_curr_tags) 
                  if(existing_tags.has(event.target.value)) {
                     existing_tags.delete(event.target.value)
                  }
                  else {
                     existing_tags.add(event.target.value)
                  }
                  tags_input.value = [...existing_tags].sort()
               }
            })
         })
      }
   }

   enable_submit = () => {
      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {
         apply_btns.forEach((apply_btn) => {
            apply_btn.classList.remove('disabled')
         })
      }      
      this.#submit_enabled = true
   }

   disable_submit = () => {
      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {
         apply_btns.forEach((apply_btn) => {
            apply_btn.classList.add('disabled')
         })
      }
      this.#submit_enabled = false
   }

   
   display_image_or_filetype = async (parent_elem,file_path,alt_text) => {

      if(await file_exists(file_path)) {

         if(is_img_ext(file_path)) {

            // process img file            
            let img = build_img_elem('record_img',file_path,alt_text,[],['record_image'])
            if(img) parent_elem.replaceChildren(create_div(),img)
         } 
         else {

            // process non-img file
            const icon_img_file_path = get_file_type_icon(file_path)
            const ext = file_path.slice(-3,file_path.length)
            let img = build_img_elem('record_img',icon_img_file_path,`${ext} file icon`,[],['record_image'])
            if(img) parent_elem.replaceChildren(create_div(),img)
         }
      }
      else {
         const no_file_icon_img = build_img_elem(`record_img`,'imgs\\icons\\exclamation-square.svg',`item date`,[{key:'height',value:'24px'}],['bg_yellow_100','mt_1'])
         img_col.append(create_div(),no_file_icon_img)
         let msg = create_div({
            classlist:['text_sm'],
            text:'The file was not found.'
         })
         parent_elem.append(create_div(),msg)
      } 
   }

   // Errors are highlight bars beneath each input field
   highlight_errors = (errors) => {
      errors.forEach((error) => {         
         let elem = document.getElementById(`${error.name}_error`)
         if(elem) {
            elem.classList.add('active_error')
            elem.innerText = `[${error.name}] ${error.message}`
         }
      })
   }
   clear_errors = () => {
      let error_bars = document.querySelectorAll('.error_bar')
      if(error_bars) {
         error_bars.forEach((error_bar) => {
            error_bar.classList.remove('active_error')
            error_bar.innerText = ''
         })
      }
   }
}


export default CollectionItemForm