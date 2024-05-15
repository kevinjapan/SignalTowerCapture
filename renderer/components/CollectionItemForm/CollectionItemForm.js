import App from '../App/App.js'
import CollectionItemFormRow from '../CollectionItemFormRow/CollectionItemFormRow.js'
import TagsSelector from '../TagsSelector/TagsSelector.js'
import FileTypeCheckBox from '../Forms/FileTypeCheckbox/FileTypeCheckbox.js'
import DisplayImgOrIcon from '../Utilities/DisplayImgOrIcon/DisplayImgOrIcon.js'
import FormBtns from '../FormBtns/FormBtns.js'
import Notification from '../../components/Notification/Notification.js'
import { DESC } from '../../utilities/ui_descriptions.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import { ui_friendly_text } from '../../utilities/ui_strings.js'
import {title_from_file_name,no_root_folder } from '../../utilities/ui_utilities.js'
import { create_section,create_div,create_form,create_label } from '../../utilities/ui_elements.js'


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

   #submit_enabled = true


   constructor(props) {
      this.#props = props
      if(typeof this.#props.item !== 'undefined') this.#record_id = this.#props.item.id
   }

   render = async() =>  {

      this.#root_folder = App.get_root_folder()
      if(this.#root_folder === '') return no_root_folder()

      this.#record_elem = create_section({
         classlist:['collection_item_record']
      })
      let text_col = create_div({
         classlist:['text_col','pl_1']
      })
      let img_col = create_div({
         attributes:[{key:'id',value:'img_col'}],
         classlist:['img_col']
      })
      let form_layout = create_form({
         attributes:[{key:'id',value:'item_form'}],
         classlist:['form_layout']
      })
      let submit_outcome_top = create_section({classlist:['submit_outcome']})

      // we don't inc cancel btn in add 'new' record forms
      const inc_cancel_btn = this.#props.action === 'add' ? false : true

      let btn_group_1 = FormBtns.render(this.#props.item,inc_cancel_btn)
      form_layout.append(btn_group_1,submit_outcome_top)
      text_col.append(form_layout)
      
      // each row is itself a grid      
      const form_content = create_div({
         classlist:['bg_white','p_.5','pl_1','pr_1','rounded']
      })

      if(Array.isArray(this.#props.fields)) {

         // build the row for the current field
         this.#props.fields.forEach( async(field) => {

            let curr_field_value = ''
            if(curr_field_value === null) curr_field_value = ''
            if(typeof this.#props.item !== 'undefined') curr_field_value = this.#props.item[field.key]
            if(field.key === 'file_type' && curr_field_value === '') curr_field_value = 'File'

            form_content.append(CollectionItemFormRow.render(field,curr_field_value))

            if(field.key === 'tags') {
               let field_label = create_label({
                  attributes:[{key:'for',value:field.key}],
                  text:ui_friendly_text(field.key)
               })
               const current_tags = (this.#props.item) 
                  ?  this.#props.item[field.key] ? this.#props.item[field.key].split('*') : []
                  :  []

               // placeholder - we inject once promise is resolved..
               const tags_placeholder = create_div({attributes:[{key:'id',value:'tags_placeholder'}]})
               form_content.append(field_label,tags_placeholder)

               const tag_selector = new TagsSelector(this.#tags_obj,current_tags)
               tags_placeholder.append(await tag_selector.render(this.#props.context ? this.#props.context : {}))
               setTimeout(() => tag_selector.activate(),200)
            }
            
            // file_type checkboxes
            if(field.key === 'file_type') form_content.append(create_div(),FileTypeCheckBox.render(field.key,curr_field_value))             

            // display img or icon
            if(field.key === 'file_name' && this.#props.item) {
               let relative_folder_path = this.#props.item['folder_path']              
               if(relative_folder_path !== '') relative_folder_path += '\\'   // allow for empty folder_path (if file is in root_folder)
               let file_path = `${this.#root_folder}\\${relative_folder_path}\\${this.#props.item[field.key]}`
               await DisplayImgOrIcon.render(img_col,file_path,this.#props.item['img_desc'])
            }
         })
      }
      let btn_group_2 = FormBtns.render(this.#props.item,inc_cancel_btn)
      let submit_outcome_bottom = create_section({classlist:['submit_outcome']})

      // assemble
      form_layout.append(form_content)
      form_layout.append(submit_outcome_bottom,create_div(),btn_group_2)
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

   // enable buttons/links displayed in the render
   activate = () => {

      // On 'Apply' add or update CollectionItemForm
      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {
         apply_btns.forEach((apply_btn) => {
            apply_btn.innerText = this.#props.action === 'add' ? 'Submit' : 'Update'

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
                  if(this.#props.action === 'add') {
                     response = await window.collection_items_api.addCollectionItem(updated_collection_item)
                  }
                  else {
                     // FormData only returns the non-disabled input key/value pairs - we add 'id'
                     updated_collection_item.id = this.#record_id
                     response = await window.collection_items_api.updateCollectionItem(updated_collection_item)
                  }

                  if(response.outcome === 'success') {                     
                     try {
                        let collection_item_id = response.collection_item.id
                        const collection_item_obj = await window.collection_items_api.getCollectionItem(collection_item_id)
                        if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {
                           this.#props.item = collection_item_obj.collection_item
                           App.switch_to_component('Record',this.#props)
                        }
                     }
                     catch(error) {
                        App.switch_to_component('Error',{
                           msg:'Sorry, we were unable to locate the Record.',
                           error:error
                        })
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
      const cancel_btns = document.querySelectorAll('.cancel_btn')      
      if(cancel_btns) {
         cancel_btns.forEach((cancel_btn) => {
            cancel_btn.addEventListener('click',async(event) => {               
               event.preventDefault()               
               if(typeof cancel_btn.attributes['data-id'] !== 'undefined') {
                  try {
                     const collection_item_obj = await window.collection_items_api.getCollectionItem(cancel_btn.attributes['data-id'].value)
                     if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {
                        App.switch_to_component('Record',this.#props)
                     }
                     else {
                        throw 'Sorry, we were unable to locate the Record.'
                     }
                  }
                  catch(error) {
                     App.switch_to_component('Error',{
                        msg:'Sorry, we were unable to locate the Record.',
                        error:error
                     })
                  }
               }
               else {
                  App.switch_to_component('Error',{
                     msg:'Sorry, we were unable to locate the Record.'
                  })
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
                  if(path.indexOf(this.#root_folder) === 0) {                        
                     folder_path.value = path.replace(this.#root_folder,'') // relative path
                  }
                  else {
                     this.disable_submit()
                     Notification.notify('#find_file_outcome',`Invalid location - the folder you selected is not within the Collections Folders.`,[],false)
                     return
                  }
               }
               
               // Auto-gen candidate title from the file name if non-exists
               // we always overwrite based on file_name - priority is convenience
               let title = document.getElementById('title')
               if(title) title.value = title_from_file_name(file_name_input.value)

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
                        App.switch_to_component('Error',{
                           msg:'Sorry, we were unable to process an invalid response from the main process in CollectionItemForm.'
                        })
                     }
                  }
                  else {
                     throw 'No records were returned.' + collection_items_obj.message ? collection_items_obj.message : ''
                  }
               }
               catch(error) {
                  App.switch_to_component('Error',{
                     msg:'Sorry, we were unable to access the Records.',
                     error:error
                  })
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


   activate_tags = () => {
      
      // On change tag checkbox
      const tags_checkboxes = document.querySelectorAll('.tags_checkbox')
      if(tags_checkboxes) {
         tags_checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change',(event) => {
               const tags_input = document.getElementById('tags')
               if(tags_input) {
                  // get existing tags list (remove any non-registered tag tokens)
                  const curr_tags = tags_input.value.split('*').filter(e => e)
                  const verified_curr_tags = curr_tags.filter(curr_tag => {
                     return this.#tags_obj.tags.some(tag => tag.tag === curr_tag)
                  })
                  const existing_tags = new Set(verified_curr_tags)
                  existing_tags.has(event.target.value) ? existing_tags.delete(event.target.value) : existing_tags.add(event.target.value)                    
                  tags_input.value = [...existing_tags].sort().join('*')    // build str w/ '*' delimiter
               }
            })
         })
      }
   }

   enable_submit = (enabled = true) => {
      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {
         apply_btns.forEach((apply_btn) => {
            apply_btn.classList.remove('disabled')
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