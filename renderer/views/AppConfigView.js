import { app } from '../renderer.js'
import PageBanner from '../components/PageBanner/PageBanner.js'
import SelectFolderComponent from '../components/SelectFolderComponent/SelectFolderComponent.js'
import FormBtns from '../components/Forms/FormBtns/FormBtns.js'
import Notification from '../components/Notification/Notification.js'
import { ui_friendly_text } from '../utilities/ui_strings.js'
import { create_section,create_div,create_p,create_form,create_label,create_input,create_textarea } from '../utilities/ui_elements.js'



// App Settings


class AppConfigView {

   #id

   #context = {key:'AppConfigView'}

   #update_required = false

   render = async() =>  {

      const fields_result_obj = await this.get_app_config_fields()
      const record_result_obj = await this.get_app_config_record()

      // App Config Settings
      // 'fields' is primarily an array of key of properties in the 'app_config_record' and preserves the display order
      //  all our input validation is carried out 'server-side'
      const fields = fields_result_obj.fields.filter((field) => field.config_edit)
      const app_config_record = record_result_obj.app_config
      
      const app_settings_section = create_section({
         attributes:[{key:'id',value:'app_settings_section'}]
      })
      const page_banner = new PageBanner({
         icon_name:'settings',
         title:'App Settings',
         lead:'Update your application settings here.'
      })
      const form = create_form({
         attributes:[{key:'id',value:'item_form'}],
         classlist:['config_form','mt_0']
      })
      const text_col = create_div({
         classlist:['text_col','ml_2','mr_0']
      })
      

      
      //
      // display edit for each App Config Setting
      //

      let panel = null
      let value = ''
      
      if(Array.isArray(fields)) {

         fields.forEach(async(field) => {

            // each App Config Setting form field is displayed on white panel
            panel = create_div({
               classlist:['bg_white','rounded_sm','mx_2','mb_1','p_1','w_full']
            })

            if(typeof app_config_record !== 'undefined') {
               value = app_config_record[field.key]
            }

            // for all types we can set null to empty string
            if(value === null) value = ''        
            
            let field_label = create_label({
               attributes:[{key:'for',value:field.key}],
               classlist:['text_h4'],
               text: ui_friendly_text(field.key)
            })

            // Build the input element
            let field_input

            if(field.test.type === 'string' && field.test.len > 255) {
               field_input = create_textarea({
                  attributes:[
                     {key:'id',value:field.key},
                     {key:'name',value:field.key},
                     {key:'type',value:'text'},
                     {key:'value',value:value},
                     {key:'readonly',value:field.readonly ? 'readonly' : false},
                  ],
                  classlist:['input_field']
               })
               field_input.value = value
               if(!field.editable) field_input.disabled = 'disabled'
               if(field.placeholder) field_input.setAttribute('placeholder',field.placeholder)

               // listen for changes so we can enable apply btn
               if(!field.is_folder) setTimeout(() => this.register_input_listener(field.key),100)
            }
            else {
               field_input = create_input({
                  attributes:[
                     {key:'id',value:field.key},
                     {key:'name',value:field.key},
                     {key:'type',value:'text'},
                     {key:'value',value:value},
                     {key:'readonly',value:field.readonly ? 'readonly' : false},
                  ],
                  classlist:['input_field','w_90','m_1']
               })
               if(!field.editable) field_input.disabled = 'disabled'
               if(field.placeholder) field_input.setAttribute('placeholder',field.placeholder)

               // listen for changes so we can enable apply btn
               if(!field.is_folder) setTimeout(() => this.register_input_listener(field.key),100)
            }

            // for root_folder, we include warning
            let warning
            if(field.key === 'root_folder') {               
               // stress impact of changing this to user
               warning = create_p({
                  classlist:['bg_yellow','fit_content','border_radius_1','p_1'],
                  text:`IMPORTANT: changing this setting will point the system at the new root folder 
                  - and it will no longer find files in the previous location. Only change this if you
                  have reason to move your files to a new root folder location.`
               })
            }

            // for btn, side-by-side w/ description text
            const desc_btn_row = create_div({
               classlist:['flex','align_items_center','pt_1']
            })
            let field_desc
            if(typeof field.desc !== 'undefined') {
               field_desc = create_div({
                  classlist:['mt_0.5','mb_0','p_1','pt_0','pb_0','w_50'],
                  text:field.desc
               })
            } 
            desc_btn_row.append(field_desc)
            // user can select folder via native file explorer 
            if(field.is_folder) {
               let folder_selector = new SelectFolderComponent()
               desc_btn_row.append(folder_selector.render(field.key,this.input_changed))
               // delay to let form.append below take effect
               setTimeout(() => folder_selector.activate(field.key),200)
            }

            let field_error = create_div({
               attributes:[{key:'id',value:`${field.key}_error`}],
               classlist:['error_bar','bg_yellow'],
               text:''
            })

            panel.append(field_label)
            if(desc_btn_row)panel.append(desc_btn_row)
            panel.append(field_input)
            if(warning)panel.append(warning)
            panel.append(field_error)
            text_col.append(panel)
         })
      }

      // future : align 'apply' btn better
      
      if(typeof app_config_record !== 'undefined') this.#id = app_config_record.id
      const form_btns_top = FormBtns.render(null,[],false)
      const form_btns = FormBtns.render(null,[],false)
      const notifications = create_div({attributes:[{key:'id',value:'notifications'}]})

      window.scroll(0,0)
      
      // assemble
      form.append(
         form_btns_top,
         text_col,
         create_div(),
         form_btns,
         notifications
      )
      app_settings_section.append(
         page_banner.render(),
         form
      )
   
      return app_settings_section
   }
   
   //
   // enable buttons/links displayed in the render
   //
   activate = (action = 'update') => {


      // On 'Apply' add or update AppConfigView

      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {
   
         apply_btns.forEach((apply_btn) => {

            apply_btn.innerText = 'update'
            
            apply_btn.addEventListener('click',async(event) => {

               event.preventDefault()
               this.clear_errors()

               Notification.notify('#notifications',``)

               const item_form = document.getElementById('item_form')

               if(item_form) {

                  // since we are dynamically generating form elements (hence we don't know what they are here)
                  // we validate inputs in the main process (good enough given this is a closed desktop app) 

                  // build the updated AppConfig Record 
                  const form_data = new FormData(item_form)
                  let update_app_config = {}
                  for(const pair of form_data.entries()) {
                     // we don't escape_html since we never user innerHTML
                     update_app_config[pair[0]] = pair[1].trim()
                  }
         
                  // FormData only returns the non-disabled input key/value pairs - so we add 'id'
                  update_app_config.id = this.#id

                  let response = await window.config_api.updateAppConfig(update_app_config)
                  
                  if(response.outcome === 'success') {
                     Notification.notify('#notifications',`${action} successfully applied.`,['bg_inform'])

                     // future : make scaleable (if we incrse no. of settings)
                     app.set_root_folder(form_data.get('root_folder'))
                  }
                  else {
                     if(Array.isArray(response.errors)) {
                        this.highlight_errors(response.errors)
                     }
                     Notification.notify('#notifications',`${action} attempt failed. ${response.message}`)
                  }               
               }
            })
         })
      }

   
      // on Find File select w/ dialog
      
      const find_file_btn = document.getElementById('find_file_button')
      if(find_file_btn) {
         find_file_btn.addEventListener('click',async(event) => {
            
            const sep = await window.files_api.filePathSep()

            event.preventDefault()      
            
            const result = await window.files_api.getFilePath()
      
            if(result.outcome === 'success') {

               // inject appropriate into file_name and folder_path inputs
               let full_path = result.files[0]
               let sep_last_index = full_path.lastIndexOf(sep)
               let path = full_path.substring(0,sep_last_index)
               let file = full_path.substring(sep_last_index + 1)

               let file_name_input = document.getElementById('file_name')
               if(file_name_input) {
                  file_name_input.value = file
               }
               
               let folder_path = document.getElementById('folder_path')
               if(folder_path) {
                  folder_path.value = path
               } 

            }
            else {
               Notification.notify('#notifications',result.message)
            }
         })
      }
   }

   // capture any change to input fields
   input_changed = () => {
      this.enable_apply_btn()
   }
   register_input_listener = (elem_id) => {      
      const elem = document.getElementById(elem_id)
      if(elem) {
         elem.addEventListener('input', () => {
            this.enable_apply_btn()
         })
      }
   }

   // enabled form btns since inputs have changed
   // we disable by covering w/ opaque ::before
   enable_apply_btn = () => {
      const apply_btns = document.querySelectorAll('.apply_btn')
      if(apply_btns) {   
         apply_btns.forEach((apply_btn) => {
            apply_btn.classList.remove('dimmer')
         })
      }
   }

   async get_app_config_fields() {
      return await window.config_api.getAppConfigFields()
   }
   
   async get_app_config_record() {
      return await window.config_api.getAppConfig()
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
      
   get_default_context = () => {
      return this.#context
   }
}

export default AppConfigView