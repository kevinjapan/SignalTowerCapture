import { app } from '../../../renderer.js'
import AppStatus from '../../AppStatus/AppStatus.js'
import CollectionItemFormRow from '../CollectionItemFormRow/CollectionItemFormRow.js'
import FileTypeCheckBox from '../../Forms/FileTypeCheckbox/FileTypeCheckbox.js'
import DisplayImgOrIcon from '../../Utilities/DisplayImgOrIcon/DisplayImgOrIcon.js'
import FormBtns from '../../FormBtns/FormBtns.js'
import Notification from '../../../components/Notification/Notification.js'
import { DESC } from '../../../utilities/ui_descriptions.js'
import { is_valid_response_obj } from '../../../utilities/ui_response.js'
import {title_from_file_name, is_excluded_folder, no_root_elem, no_form_fields } from '../../../utilities/ui_utilities.js'
import { create_section, create_div, create_form, create_button } from '../../../utilities/ui_elements.js'
import TagsFormCtrl from '../../Tags/TagsFormCtrl/TagsFormCtrl.js'


// all our input validation is carried out in the main process in window.collection_items_api.updateCollectionItem()
// any errors are returned from the same api function on failure


class CollectionItemForm {

   // the collection item record id 
   #record_id

   // the collection item record element
   #record_elem

   // Props -'props.fields' preserves the display order
   #props

   // tags object - containing tags fields list and config registered tags
   #tags_obj

   // Collection root folder
   #root_folder = ''
   
   #context = {
      key:'Form',
      id:null
   }

   #submit_enabled = true


   constructor(props) {
      this.#props = props
      if(typeof this.#props.item !== 'undefined') this.#record_id = this.#props.item.id
   }

   render = async() =>  {

      // bail if no root_folder      // to do : review : do we want this in all components? eg maybe only in 'views'
      this.#root_folder = app.get_root_folder()
      if(this.#root_folder === '') return no_root_elem()

      // bail if no fields 
      if(!Array.isArray(this.#props.fields)) return no_form_fields()

      // distinguish edit/add - we don't inc cancel btn in add 'new' record forms
      const inc_cancel_btn = this.#props.action === 'add' ? false : true


      // Section Container
      this.#record_elem = create_section({
         classlist:['collection_item_record']
      })

      // 2-col layout
      const img_col = create_div({
         attributes:[{key:'id',value:'img_col'}],
         classlist:['img_col']
      })
      const text_col = create_div({
         classlist:['text_col','pl_1']
      })

      // Form (in text_col)
      const form_layout = create_form({
         attributes:[{key:'id',value:'item_form'}],
         classlist:['form_layout','user_select']
      })
      text_col.append(form_layout)
      form_layout.append(FormBtns.render(this.#props.item,[],inc_cancel_btn))

      // Form Content : row grids  
      const form_content = create_div({classlist:['form_content','bg_white','p_.5','pl_1','pr_1','rounded','bg_yellow']})

      // build each row
      this.#props.fields.forEach( async(field) => {

         // default : form row : label and input 
         let curr_field_value = ''
         if(curr_field_value === null) curr_field_value = ''
         if(typeof this.#props.item !== 'undefined') curr_field_value = this.#props.item[field.key]
         if(field.key === 'file_type' && curr_field_value === '') curr_field_value = 'File'

         // add 'collection_item_form_row'
         form_content.append(CollectionItemFormRow.render(field,curr_field_value))

         // listen for changes so we can enable apply btn
         if(!field.is_folder) setTimeout(() => this.register_input_listener(field.key),100)

         // inject Tags ctrl 
         if(field.key === 'tags') {
            // this.inject_tags_ctrl(form_content,field)
            form_content.append(await TagsFormCtrl.render(field,this.#props.item,this.#tags_obj,this.#props.context))
         }
            
         // inject file_type ctrls
         if(field.key === 'file_type') this.inject_file_type_ctrls(form_content,field,curr_field_value)

         // display feature img
         if(field.key === 'file_name' && this.#props.item) {
            let relative_folder_path = this.#props.item['folder_path']              
            if(relative_folder_path !== '') relative_folder_path += '\\'   // allow for empty folder_path (if file is in root_folder)
            let file_path = `${this.#root_folder}\\${relative_folder_path}\\${this.#props.item[field.key]}`
            await DisplayImgOrIcon.render(img_col,file_path,this.#props.item['img_desc'])
         }
      })

      // assemble
      form_layout.append(form_content)
      form_layout.append(create_div(), FormBtns.render(this.#props.item ,[] ,inc_cancel_btn))
      this.#record_elem.append(img_col,text_col)

      window.scroll(0,0)
      return this.#record_elem
   }

   // hydrate w/ known field values
   hydrate = async(field_values) => {
      let elem = null
      if(Array.isArray(field_values)) {
         field_values.forEach(async(field_value) => {
            if(field_value.field === 'img') {
               let img_col = document.getElementById('img_col')
               if(img_col) await DisplayImgOrIcon.render(img_col,field_value.value,field_value.alt)
            }
            elem = document.getElementById(field_value.field)
            if(elem) elem.value = field_value.value
         })
      }
   }

   // to do : following func as separate component
   inject_file_type_ctrls(form_content,field,curr_field_value) {

      form_content.append(create_div(),FileTypeCheckBox.render(field.key,curr_field_value))
      if(this.#props.find_files) {
         // btn to select file for 'file_name' field
         let find_file_btn = create_button({
            attributes:[{key:'id',value:'find_file_btn'}],
            classlist:['form_btn','mb_2'],
            text:'Find File'
         })
         form_content.append(find_file_btn)
      }
   }            

   
   // enable buttons/links displayed in the render
   activate = async() => {

      const { action } = this.#props

      // On 'Apply' add or update CollectionItemForm
      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {
         apply_btns.forEach((apply_btn) => {
            apply_btn.innerText = action === 'add' ? 'Submit' : 'Update'

            apply_btn.addEventListener('click',async(event) => {
               event.preventDefault()
               if(this.#submit_enabled === false) return
               this.clear_errors()
               Notification.notify('.submit_outcome',``)

               const item_form = document.getElementById('item_form')
               if(item_form) {
                  // build the updated_collection_item 
                  const form_data = new FormData(item_form)
                  let updated_collection_item = {}
                  let response
                  for(const pair of form_data.entries()) updated_collection_item[pair[0]] = pair[1].trim()
                  if(action === 'add') {
                     response = await window.collection_items_api.addCollectionItem(updated_collection_item)
                  }
                  else {
                     // FormData only returns the non-disabled input key/value pairs - we add 'id'
                     updated_collection_item.id = this.#record_id
                     response = await window.collection_items_api.updateCollectionItem(updated_collection_item)
                  }

                  if(response.outcome === 'success') {

                     AppStatus.notify(`Successfully ${action === 'add' ? 'added' : 'updated'} record - "${response.collection_item.title}"`)

                     try {
                        let collection_item_id = response.collection_item.id
                        const collection_item_obj = await window.collection_items_api.getCollectionItem(collection_item_id)
                        if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {
                           this.#props.item = collection_item_obj.collection_item
                           
                           // hydrate context for history node
                           this.#props.context = {key:'Record',id:this.#props.item.id}

                           // add to history if we are adding a new Record / don't add if editing existing Record
                           app.switch_to_component('Record',this.#props,action === 'add' ? true : false)
                        }
                     }
                     catch(error) {
                        app.switch_to_component('Error',{
                           msg:'Sorry, we were unable to locate the Record.',
                           error:error
                        },false)
                     }
                  }
                  else {
                     // notify user any error msg rcvd
                     if(response.message) Notification.notify('.submit_outcome',response.message,[],false)

                     // highlight errors on ui fields
                     if(Array.isArray(response.errors)) {
                        this.highlight_errors(response.errors)
                        // ensure highlighted errors are visible
                        const first_active_error = document.getElementsByClassName('active_error')[0]
                        if(first_active_error) first_active_error.scrollIntoView({ block: "center" })
                     }
                  }               
               }
            })
         })
         const title_input = document.getElementById('title')
         if(title_input) title_input.focus()
      }
   
      // On 'Cancel' return to the CollectionItemRecord for same record
      // Cancel btn only appears in 'edit' mode
      const cancel_btns = document.querySelectorAll('.cancel_btn')      
      if(cancel_btns) {
         cancel_btns.forEach((cancel_btn) => {
            cancel_btn.addEventListener('click',async(event) => {               
               event.preventDefault()               
               if(typeof cancel_btn.attributes['data-id'] !== 'undefined') {
                  try {
                     const collection_item_obj = await window.collection_items_api.getCollectionItem(cancel_btn.attributes['data-id'].value)
                     if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {
                        app.switch_to_component('Record',this.#props,false)
                     }
                     else {
                        throw 'Sorry, we were unable to locate the Record.'
                     }
                  }
                  catch(error) {
                     app.switch_to_component('Error',{
                        msg:'Sorry, we were unable to locate the Record.',
                        error:error
                     },false)
                  }
               }
               else {
                  app.switch_to_component('Error',{
                     msg:'Sorry, we were unable to locate the Record.'
                  },false)
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
               if(file_name_input) file_name_input.value = file
               
               let folder_path = document.getElementById('folder_path')
               if(folder_path) {

                  const is_excluded = await is_excluded_folder(path)
                  
                  // verify file is within root_folder and not in Settings.exluded_folders
                  if(path.indexOf(this.#root_folder) === 0 && !is_excluded) {                        
                     folder_path.value = path.replace(this.#root_folder,'') // relative path
                  }
                  else {
                     this.disable_submit()

                     // future : find_file_outcome is defined in FileTypeCheckbox - should be in this class? rollout this file
                     Notification.notify(
                        '#find_file_outcome',
                        `Invalid location - the selected folder is not within the Collections Folders or is an excluded sub-folder.`,
                        [],
                        false)
                     return
                  }
               }

               // display if new file is an img file
               let file_path = `${path}\\${file}`
               await DisplayImgOrIcon.render(img_col,file_path,this.#props.item ? this.#props.item['img_desc'] : 'image')

               // Is there an existing record for the selected file?
               let context = {
                  page:1,
                  field_filters:[
                     {field:'file_name',value:file},
                     {field:'folder_path',value:path.replace(this.#root_folder,'')}]
               }

               try {                
                  const collection_items_obj = await window.collection_items_api.getItems(context)
                  
                  if (typeof collection_items_obj != "undefined" && collection_items_obj.outcome === 'success') {                        
                     if(await is_valid_response_obj('read_collection_items',collection_items_obj)) {

                        if(collection_items_obj.collection_items.length < 1) {
                           // There is no record for this file
                           this.enable_submit()
                           Notification.notify('#find_file_outcome',`This file is valid.`,['bg_inform'],false)

                           // Auto-gen candidate title from the file name if non-exists
                           // we always overwrite based on file_name - priority is convenience
                           let title = document.getElementById('title')
                           if(title && title.value === '') title.value = title_from_file_name(file_name_input.value)

                        }
                        else {
                           // There is an existing record for this file
                           if(action === 'update') {
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
                        app.switch_to_component('Error',{
                           msg:'Sorry, we were unable to process an invalid response from the main process in CollectionItemForm.'
                        },false)
                     }
                  }
                  else {
                     throw 'No records were returned.' + collection_items_obj.message ? collection_items_obj.message : ''
                  }
               }
               catch(error) {
                  app.switch_to_component('Error',{
                     msg:'Sorry, we were unable to access the Records.',
                     error:error
                  },false)
               }
            }
            else {
               Notification.notify('#find_file_outcome',result.message)
            }
         })
      }

      // On change file_type radio btn
      const file_type_radio_btns = document.querySelectorAll('input[name="file_type_radio_btns"]')
      if(file_type_radio_btns) {
         file_type_radio_btns.forEach((radio_btn) => {            
            radio_btn.addEventListener('change',(event) => {               
               const file_type = document.getElementById('file_type')
               if(file_type) file_type.value = event.target.value   
               const file_type_info = document.getElementById('file_type_info')
               if(file_type_info) file_type_info.innerText = event.target.value === 'File' ? DESC.FILE_ITEM_FILETYPE : DESC.FOLDER_ITEM_FILETYPE
            })
         })
      }
   }

   // capture any change to input fields
   // input_changed = () => {
   //    this.enable_apply_btn()
   // }
   register_input_listener = (elem_id) => {      
      const elem = document.getElementById(elem_id)
      if(elem) {
         elem.addEventListener('input', () => {
            this.enable_submit()
         })
      }
   }
   
   // enabled form btns since inputs have changed
   // we disable by covering w/ opaque ::before


   enable_submit = (enabled = true) => {
      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {
         apply_btns.forEach((apply_btn) => {
            // future : integrate/single method here : w/ AppConfigForm
            // original method for this component
            apply_btn.classList.remove('disabled')
            // method deployed by AppConfigForm in  FormBtns
            apply_btn.classList.remove('dimmer')
         })
      }      
      this.#submit_enabled = enabled
   }
   disable_submit = () => {
      this.enable_submit(false)
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