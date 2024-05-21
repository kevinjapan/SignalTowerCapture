import App from '../App/App.js'
import RecordBtns from '../RecordBtns/RecordBtns.js'
import RecordAdmin from '../RecordAdmin/RecordAdmin.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import { ui_friendly_text,trim_char,trim_end_char } from '../../utilities/ui_strings.js'
import { get_ext,is_img_ext,get_file_type_icon,file_exists,build_img_elem,add_to_int_queue,ints_array,no_root_folder } from '../../utilities/ui_utilities.js'
import { create_section,create_div,create_p } from '../../utilities/ui_elements.js'



class CollectionItemRecord {

   // props.context, props.fields, props.item
   // 'fields' is an array of names of properties in the 'item' and preserves the display order
   #props

   #record


   constructor(props) {
      this.#props = props
   }

   render = async() => {

      this.#props.root_folder = App.get_root_folder()
      if(this.#props.root_folder === '') return no_root_folder()
      
      // update Recent records
      const app_config_obj = await window.config_api.getAppConfig()
      if(app_config_obj.outcome === 'success') {  
         const app_config = app_config_obj.app_config

         let recent_records = app_config.recent_records
         let ints_queue = ints_array(recent_records.split(','))
         let app_config_recent = {
            id:app_config.id,
            recent_records: add_to_int_queue(ints_queue,20,this.#props.item.id).join()
         }
         await window.config_api.updateAppConfig(app_config_recent)
      }

      // component container
      this.#record = create_section({
         classlist:['collection_item_record','fade_in']
      })

      // 2-col layout
      let text_col = create_div({
         classlist:['text_col','pl_1']
      })
      let img_col = create_div({
         classlist:['img_col','text_center'],
      })

      // img viewer (hidden initially)
      let img_view = create_div({
         attributes:[{key:'id',value:'img_view'}],
         classlist:['img_view']
      })

      // mark/highlight if record has been soft-deleted
      if(this.#props.item['deleted_at']) {
         const notify_deleted = create_p({
            classlist:['bg_yellow_100','grid_span_2','rounded','p_1'],
            text:'This record has previously been deleted and will soon be permanently auto-deleted from the system.'
         })
         this.#record.append(notify_deleted)
      }

      // 'form' layout inside text_col
      let form_layout = create_div({
         attributes:[{key:'id',value:'item_form'}],
         classlist:['form_layout']
      })
      text_col.append(form_layout)

      form_layout.append(RecordBtns.render(this.#props.item.id,this.#props.context ? true : false))

      const record_content = create_div({
         classlist:['record_content','bg_white','p_.5','pl_1','pr_1','rounded']
      })
      
      // build each field row on the form
      let field_label
      let field_value
      
      // append form element for each Record field
      if(Array.isArray(this.#props.fields)) {
         
         this.#props.fields.forEach( async (field) => { 

            field_label = create_div({
               classlist:['label','mb_1',`${field.key === 'title' ? 'line_2' : ''}`],
               text:ui_friendly_text(field.key)
            })

            if(field.key === 'title') {            
               // we rpt display of title above img when stacked on sm views
               let img_col_title = create_div({
                  classlist:[`ci_form_${field.key}`,'stacked_img_title','mb_1'],
                  text:this.#props.item[field.key]
               })
               img_col.append(img_col_title)
            }

            if(field.key === 'tags') {
               field_value = create_div()
               field_value.append(this.display_tags(this.#props.item[field.key]))
            }
            else {
               field_value = create_div({        
                  classlist:['break_words',`ci_form_${field.key}`],
                  text:this.#props.item[field.key]
               })
            }
            
            // add current elem to form content
            record_content.append(field_label,field_value)

            // display file if file_name is recognized image type
            if(field.key === 'file_name') {
                  
               // build the file_path
               let root_part = trim_end_char(this.#props.root_folder,'\\')
               let relative_folder_part = trim_char(this.#props.item['folder_path'],'\\')
               
               // allow for empty folder_path (files in root_folder)
               if(relative_folder_part !== '') relative_folder_part += '\\'

               let file_part = this.#props.item[field.key]
               let file_path = `${root_part}\\${relative_folder_part}${file_part}`

               if(await file_exists(file_path)) {
                  
                  if(is_img_ext(file_path)) {                  
                     // process img file
                     let img = build_img_elem(file_path,this.#props.item['img_desc'],[{key:'id',value:'record_img'}],['record_image'])
                     if(img) img_col.append(img)
                  }
                  else {
                     // process non-img file
                     const icon_img_file_path = get_file_type_icon(file_path)
                     const ext = get_ext(file_path)
                     let img = build_img_elem(icon_img_file_path,`${ext} file icon`,
                        [],
                        ['record_card_image','card_title_link','cursor_pointer']
                     )
                     if(img) img_col.replaceChildren(create_div(),img)
                  }
               }
               else {
                  const no_file_icon_img = build_img_elem('imgs\\icons\\exclamation-square.svg',`item date`,[{key:'height',value:'24px'}],['bg_yellow_100','mt_1'])
                  img_col.append(create_div(),no_file_icon_img)
                  let msg = create_div({
                     classlist:['text_sm'],
                     text:'The file was not found.'
                  })
                  img_col.append(create_div(),msg)
               }
            }
         })
      }      
      form_layout.append(record_content)
      form_layout.append(RecordBtns.render(this.#props.item.id,this.#props.context ? true : false))
      const record_admin = new RecordAdmin(this.#props)
      setTimeout(() => record_admin.activate(),300)

      // assemble
      img_col.append(img_view)
      this.#record.append(img_col,text_col,img_view,record_admin.render())

      if(this.#props.item['deleted_at']) {
         const notify_deleted = create_p({
            classlist:['bg_yellow_100','grid_span_2','rounded','p_1'],
            text:'This record has previously been deleted and will soon be permanently auto-deleted from the system.'
         })
         this.#record.append(notify_deleted)
      }
      window.scroll(0,0)
      return this.#record
   }

   // enable buttons/links displayed in the render
   activate = () => {

      const edit_buttons = document.querySelectorAll('.edit_button')
      if(edit_buttons) {
         edit_buttons.forEach((edit_button) => {
            edit_button.addEventListener('click',async(event) => {   
               try {
                  const collection_item_obj = await window.collection_items_api.getCollectionItem(edit_button.attributes['data-id'].value)
                  if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {      
                     if(await is_valid_response_obj('read_single_collection_item',collection_item_obj)) {

                        // display single CollectionItem for editing in CollectionItemForm
                        this.#props = {
                           fields:collection_item_obj.collection_item_fields,
                           item:collection_item_obj.collection_item,
                           context:this.#props.context ? this.#props.context : null,
                           action:'update'
                        }
                        App.switch_to_component('Form',this.#props)
                     }
                     else {
                        App.switch_to_component('Error',{
                           msg:'Sorry, we were unable to process an invalid response from the main process in CollectionItemRecord.'
                        })
                     }
                  }
                  else {
                     App.switch_to_component('Error',{
                        msg:'Sorry, we were unable to locate the Record.',
                        error:error
                     })
                  }
               }
               catch(error) {
                  App.switch_to_component('Error',{
                     msg:'Sorry, we were unable to locate the Record.',
                     error:error
                  })
               }
            })
         })
      }

      // 'open folder' btn
      let open_folder_btns = document.querySelectorAll('.open_folder_btn')
      if(open_folder_btns){
         open_folder_btns.forEach(open_folder_btn => {
            open_folder_btn.addEventListener('click',() => {
               window.files_api.openFolder(this.#props.root_folder + this.#props.item.folder_path)
            })
         })
      }
      
      // image viewer
      let record_img = document.getElementById('record_img')
      if(record_img) {
         record_img.addEventListener('click',() => {
            // we pass 'props.context' as a token for info and to enable returning to this Record
            App.switch_to_component('ImageViewer',this.#props)
         })
      }

      // 'back' btn
      let back_btns = document.querySelectorAll('.back_btn')
      if(back_btns){
         back_btns.forEach(back_btn => {
            back_btn.addEventListener('click',async(event) => {
               // the context token identifies the current user context inc. component
               if(this.#props.context) {
                  App.switch_to_component(this.#props.context.key,this.#props)
               }             
            })
         })
      }
   }

   display_tags = (tags_csv) => {
      if(tags_csv) {
         const tags = tags_csv.split('*')
         const tags_elem = create_div({
            classlist:['flex','gap_0.5']
         })
         tags.forEach(tag => {
            let tagger = create_div({
               classlist:['inline_block','text_grey','border','rounded','pl_0.25','pr_0.25','pb_0.15'],
               text:tag
            })
            tags_elem.append(tagger)
         })
         return tags_elem
      }
      return ''
   }
}


export default CollectionItemRecord