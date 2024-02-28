import App from '../App/App.js'
import RecordBtns from '../RecordBtns/RecordBtns.js'
import RecordAdmin from '../RecordAdmin/RecordAdmin.js'
import { ui_friendly_text,trim_char,trim_end_char } from '../../utilities/ui_strings.js'
import { is_image_file, build_img_elem,add_to_int_queue,ints_array } from '../../utilities/ui_utilities.js'
import { create_section,create_div,create_p,create_button } from '../../utilities/ui_elements.js'




class CollectionItemRecord {

   // props.context, props.fields, props.item
   // 'fields' is an array of names of properties in the 'item' and preserves the display order
   #props

   #record

   constructor(props) {
      this.#props = props
   }

   render = async() => {

      // get root_folder
      const app_config_obj = await window.config_api.getAppConfig()
      if(app_config_obj.outcome === 'success') {
         this.#props.root_folder = app_config_obj.app_config.root_folder
      }

      // update Recent records
      const app_config = app_config_obj.app_config

      let recent_records = app_config.recent_records
      let ints_queue = ints_array(recent_records.split(','))
      let app_config_recent = {
         id:app_config.id,
         recent_records: add_to_int_queue(ints_queue,20,this.#props.item.id).join()
      }

      const result = await window.config_api.updateAppConfig(app_config_recent)

      // component container
      this.#record = create_section({
         classlist:['collection_item_record']
      })

      // 2-col layout
      let text_col = create_div({
         classlist:['text_col','pl_1']
      })
      let img_col = create_div({
         classlist:['img_col'],
      })


      // img viewer (hidden initially)
      let img_view = create_div({
         attributes:[
            {key:'id',value:'img_view'}
         ],
         classlist:['img_view']
      })

      // mark/highlight if record has been soft-deleted
      if(this.#props.item['deleted_at']) {
         const notify_deleted = create_p({
            classlist:['bg_yellow_100','grid_span_2'],
            text:'This record has previously been deleted and will soon be permanently auto-deleted from the system.'
         })
         this.#record.append(notify_deleted)
      }

      // 'form' layout inside text_col
      let form_layout = create_div({
         attributes:[
            {key:'id',value:'item_form'}
         ],
         classlist:['form_layout']
      })
      text_col.append(form_layout)

      form_layout.append(RecordBtns.render(this.#props.item.id,this.#props.context ? true : false))

      
      // build each field row on the form
      let field_label
      let field_value
      
      // append form element for each Record field
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
                     
         form_layout.append(field_label,field_value)

         // display file if file_name is recognized image type
         if(field.key === 'file_name') {
               
            // build the file_path
            let root_part = trim_end_char(this.#props.root_folder,'\\')
            let relative_folder_part = trim_char(this.#props.item['folder_path'],'\\')
            let file_part = this.#props.item[field.key]
            let file_path = `${root_part}\\${relative_folder_part}\\${file_part}`

            if(await is_image_file(file_path)) {          
               let img = await build_img_elem('record_img',file_path,this.#props.item['img_desc'],[],['record_image'])
               if(img) {
                  img_col.append(img)
               }
            }
            else {
               img_col.append(create_div(),document.createTextNode(`No image file was found.\n${file_path}`))
            }
         }
      })
      

      form_layout.append(RecordBtns.render(this.#props.item.id,this.#props.context ? true : false))

      const record_admin = new RecordAdmin(this.#props)
      setTimeout(() => record_admin.activate(),300)


      // assemble

      img_col.append(img_view)
      this.#record.append(img_col,text_col,img_view,record_admin.render())

      if(this.#props.item['deleted_at']) {
         const notify_deleted = create_p({
            classlist:['bg_yellow_100','grid_span_2'],
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
      
                  if (typeof collection_item_obj != "undefined") {
      
                     if(collection_item_obj.outcome === 'success') {
      
                        // display single CollectionItem for editing in CollectionItemForm
                        this.#props = {
                           fields:collection_item_obj.collection_item_fields,
                           item:collection_item_obj.collection_item,
                           context:this.#props.context ? this.#props.context : null
                        }
                        App.switch_to_component('Form',this.#props)
                     } 
                     else {
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
               }
               catch(error) {
                  let props = {
                     msg:'Sorry, we were unable to locate the Record.',
                     error:error
                  }
                  App.switch_to_component('Error',props)
               }
            })
         })
      }


      // open file's folder
      let open_folder_btn = document.getElementById('open_folder_btn')
      if(open_folder_btn) {
         open_folder_btn.addEventListener('click',() => {
            window.files_api.openFolder(this.#props.item.folder_path)
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
         const tags = tags_csv.split(',')
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