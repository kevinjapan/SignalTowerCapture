import App from '../App/App.js'
import FormBtns from '../FormBtns/FormBtns.js'
import { ui_friendly_text } from '../../utilities/ui_strings.js'
import { is_image_file, build_img_elem } from '../../utilities/ui_utilities.js'

import { 
   create_section,
   create_div,
   create_form,
   create_label,
   create_button,
   create_input,
   create_textarea
} from '../../utilities/ui_elements.js'


// all our input validation is carried out in the main process in window.collection_items_api.updateCollectionItem()
// any errors are returned from the same api function on failure



class CollectionItemForm {

   // the collection item record id 
   // the FormData will not contain this since we only expose 'editable' fields in the UI form
   #record_id

   // the collection item record
   #record

   // Props
   // fields, item, [search_obj]
   // 'props.fields' preserves the display order
   #props


   constructor(props) {
      this.#props = props
   }


   render = () =>  {

      // component container
      //
      this.#record = create_section({
         classlist:['collection_item_record']
      })

      // 2-col layout
      //
      let text_col = create_div({
         classlist:['text_col']
      })
      let img_col = create_div({
         attributes:[
            {key:'id',value:'img_col'}
         ],
         classlist:['img_col']
      })


      // form & layout - inside text_col
      //
      let form = create_form({
         attributes:[
            {key:'id',value:'item_form'}
         ],
         classlist:['form_layout']
      })
      
      let btn_group_1 = FormBtns.render(this.#props.item)
      form.append(create_div(),btn_group_1)
      text_col.append(form)
      

      // we build each form field row(s) in parent grid as:
      //
      //    |  field_label  |   field_input   |
      //    |               |   field_error   |
      //    |               | [find_file_btn] |

      this.#props.fields.forEach( async(field) => {

         let value = ''
         if(typeof this.#props.item !== 'undefined') {
            value = this.#props.item[field.key]
         }
         if(value === null) value = ''        
         
         let field_label = create_label({
            attributes:[
               {key:'for',value:field.key}
            ],
            text:ui_friendly_text(field.key)
         })

         let field_input

         if(field.test.type === 'string' && field.test.len > 255) {
            field_input = create_textarea({
               attributes:[
                  {key:'id',value:field.key},
                  {key:'name',value:field.key},
                  {key:'type',value:'text'},
                  {key:'value',value:value},
               ],
               classlist:['input_field']
            })
            field_input.value = value
            if(!field.editable) field_input.disabled = 'disabled'
            if(field.placeholder) field_input.setAttribute('placeholder',field.placeholder)
         }
         else {
            field_input = create_input({
               attributes:[
                  {key:'id',value:field.key},
                  {key:'name',value:field.key},
                  {key:'type',value:'text'},
                  {key:'value',value:value},
               ],
               classlist:['input_field']
            })
            if(!field.editable) field_input.disabled = 'disabled'
            if(field.placeholder) field_input.setAttribute('placeholder',field.placeholder)
         }

         // error ui
         let field_error = create_div({
            attributes:[
               {key:'id',value:`${field.key}_error`}
            ],
            classlist:['error_bar','bg_yellow']
         })

         // assemble
         form.append(field_label,field_input,create_div(),field_error)

         // btn to select file for 'file_name' field
         if(field.key === 'file_name') {       
            let find_file_btn = create_button({
                  attributes:[
                     {key:'id',value:'find_file_btn'}
                  ],
                  text:'Find File'
               }) 
            form.append(create_div(),find_file_btn)
         }

         // display the file if a valid img and exists
         if(field.key === 'file_name' && this.#props.item) {
            await this.display_if_img_file(img_col,this.#props.item['parent_folder_path'],this.#props.item[field.key])
         }
      })

      if(typeof this.#props.item !== 'undefined') {
         this.#record_id = this.#props.item.id
      }

      let submit_outcome = create_section({
         attributes:[
            {key:'id',value:'submit_outcome'}
         ]
      })

      let btn_group_2 = FormBtns.render(this.#props.item)

      // assemble
      form.append(create_div(),btn_group_2,submit_outcome)
      this.#record.append(text_col,img_col)

      window.scroll(0,0)

      return this.#record
   }


   //
   // enable buttons/links displayed in the render
   //
   activate = (action = 'update') => {

      // On 'Apply' add or update CollectionItemForm

      const apply_btns = document.querySelectorAll('.apply_btn')
      const submit_outcome = document.getElementById('submit_outcome')

      if(apply_btns) {

         apply_btns.forEach((apply_btn) => {
            if(action === 'add') {               
               apply_btn.innerText = 'Submit'
            }
            else {               
               apply_btn.innerText = 'Update'
            }

            apply_btn.addEventListener('click',async(event) => {

               event.preventDefault()
               this.clear_errors()

               if(submit_outcome) submit_outcome.innerText = ''
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
                  if(action === 'add') {
                     response = await window.collection_items_api.addCollectionItem(updated_collection_item)
                  }
                  else {
                     // FormData only returns the non-disabled input key/value pairs - so we have to add 'id'
                     updated_collection_item.id = this.#record_id
                     console.log('updated_collection_item',updated_collection_item)
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
                     }
                  }               
               }
            })
         })
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
                     msg:'Sorry, we were unable to locate the Record.',
                     error:error
                  }
                  App.switch_to_component('Error',props)
               }
            })
         })
      }

   
      // on Find File select w/ dialog

      const find_file_btn = document.getElementById('find_file_btn')

      if(find_file_btn) {

         find_file_btn.addEventListener('click',async(event) => {
            
            event.preventDefault()    
            const sep = await window.files_api.filePathSep()  
            
            const result = await window.files_api.getFilePath()
      
            if(result.outcome === 'success') {

               // inject appropriate into file_name and parent_folder_path inputs
               let full_path = result.files[0]
               let separator = full_path.lastIndexOf(sep)
               let path = full_path.substring(0,separator)
               let file = full_path.substring(separator + 1)

               let file_name_input = document.getElementById('file_name')
               if(file_name_input) {
                  file_name_input.value = file
               }
               
               let parent_folder_path = document.getElementById('parent_folder_path')
               if(parent_folder_path) {
                  parent_folder_path.value = path
               }
               
               // auto-gen candidate title from the file name
               let title = document.getElementById('title')
               if(title) {
                  let temp = file_name_input.value
                  let candidate = temp.substring(0,temp.length - 4).replaceAll('-',' ')
                  candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1)             
                  title.value = candidate
               }

               // display if new file is an img file
               await this.display_if_img_file(img_col,path,file)
               
            }
            else {
                  console.log(result.message)
            }
         })
      }
      
      // on file_name change, we try to display the new file if img and exists

      const file_name = document.getElementById('file_name')
      const folder_path = document.getElementById('parent_folder_path')
      const img_col = document.getElementById('img_col')
      if(file_name && folder_path && img_col) {            
         file_name.addEventListener('change',async(event) => {
            await this.display_if_img_file(img_col,folder_path.value,file_name.value)
         })
      }
   }

   // display if we have a valid img file
   // is_image_file queries main process if the file exists and also if the ext is img ext

   display_if_img_file = async (parent_elem,folder_path,file_name) => {

      let res = await is_image_file(folder_path,file_name)  
      if(res) {    
         let img = await build_img_elem('record_img',folder_path,file_name)
         if(img) {
            parent_elem.replaceChildren(create_div(),img)
         }
      }
      else {
         parent_elem.replaceChildren(create_div(),document.createTextNode('No image file was found.'))
      }
   }

   
   // Errors are highlight bars beneath each input field

   highlight_errors = (errors) => {
      errors.forEach((error) => {         
         let elem = document.getElementById(`${error.name}_error`)
         if(elem) {
            elem.classList.add('active_error')
            elem.innerText = error.message
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