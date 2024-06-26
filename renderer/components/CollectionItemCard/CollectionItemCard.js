import CardContextMenu from './CardContextMenu/CardContextMenu.js'
import { get_ui_ready_date } from '../../utilities/ui_datetime.js'
import { create_section,create_div,create_h } from '../../utilities/ui_elements.js'
import { truncate } from '../../utilities/ui_strings.js'
import { icon,get_ext,is_img_ext,get_file_type_icon,file_exists,build_img_elem,build_full_path } from '../../utilities/ui_utilities.js'



class CollectionItemCard {

   #props

   constructor(props) {
      this.#props = props
   }

   render = (fields,item) => {

      const card = create_section({
         attributes:[
            {key:'data-id',value:item.id},
            {key:'data-title',value:item.title}
         ],
         classlist:['collection_item_card','cursor_pointer']
      })
      const img_block = create_div({
         classlist:['card_image_block','text_center','m_0']
      })
      const text_block = create_div({
         classlist:['card_text_block','grid_card_text_layout','relative','z_0','pl_0.5','pr_0.5','flex','flex_col','align_items_start','no_wrap','justify_end']
      })
      const folder_path_block = create_div()
      


      //
      // process each Card row (field)
      //
      let field_element
      
      // we inject placeholder and load img w/ intersection observer
      const placeholder_file_path = `imgs\\card_img_placeholder.jpg`

      if(typeof item !== 'undefined') {
         if(Array.isArray(fields)) {    

            fields.forEach(async(field) => {

               // field value
               let field_value = item[field.key]
               if(field.test.type === 'date') field_value = get_ui_ready_date(field_value)

               // icon
               const icon = get_file_type_icon(field_value)

               switch(field.key) {
               
                  case 'title':

                     if(field_value === '') field_value = 'no title'
                     field_element = create_h({
                        attributes: [{key:'data-id',value:item.id}],
                        classlist:['text_blue','card_title_link','flex_100','m_0','font_w_400','cursor_pointer','hover_line','break_words'],
                        text:field_value
                     })
                     text_block.append(field_element)
                     break

                  case 'file_name':

                     const file_ext_type_block = create_div({
                        classlist:['flex','align_items_center','gap_.5','fit_content','p_0.5','pl_0','break_words','no_wrap']
                     })
                     field_element = create_div({
                        classlist:['pt_0.3'],
                        text:field_value
                     })
                     const filetype_icon = build_img_elem(icon,`${get_ext(field_value)} filetype`,[{key:'height',value:'24px'}],[])
                     file_ext_type_block.append(filetype_icon,field_element)
                     text_block.append(file_ext_type_block)
                     break

                  case 'folder_path':

                     const file_path = build_full_path(this.#props.root_folder,item.folder_path,item.file_name)

                     // wrapper to permit full width while cropping tall images
                     const record_card_image_wrap = create_div({classlist:['record_card_image_wrap']})
                     
                     // future : temp disabled - review and see if we really need improvement
                     // we load first row (4 imgs) immediately to make grid assume footprint on first render
                     // currently, if 'file not found', throws error in console - no impact on user and correctly notifies on UI
                     // const img_file_path =  this.#props.card_index < 4 ? file_path : placeholder_file_path

                     const img_file_path =  placeholder_file_path

                     if(is_img_ext(item.file_name)) {
                        const img = build_img_elem(img_file_path,item.img_desc,
                           [
                              {key:'id',value:`card_${this.#props.card_index}`},
                              {key:'data-id',value:item.id},
                              {key:'data-src',value:file_path},
                              {key:'width',value:'100%'},
                              {key:'height',value:'200px'}
                           ],
                           ['record_card_image','cursor_pointer']
                        )
                        if(img) {
                           record_card_image_wrap.append(img)
                           img_block.replaceChildren(record_card_image_wrap)
                        }
                     }
                     else {
                        const icon_img_file_path = get_file_type_icon(item.file_name)
                        const img = build_img_elem(icon_img_file_path,`${get_ext(file_path)} file icon`,
                           [
                              {key:'data-id',value:item.id},
                              {key:'data-src',value:icon_img_file_path},
                              {key:'height',value:'30px'}
                           ],
                           ['record_card_icon','cursor_pointer','pt_1']
                        )
                        if(img) {
                           record_card_image_wrap.append(img)
                           img_block.replaceChildren(record_card_image_wrap)
                        }
                     }

                     // since we are in a forEach loop, this check effectively runs as a background task, but does resolve
                     if(!await file_exists(file_path)) {
                        const no_file_icon_img = build_img_elem('imgs\\icons\\exclamation-square.svg',`item date`,[{key:'height',value:'24px'}],['bg_yellow_100','mt_5','opacity_.6'])
                        const msg = create_div({
                           classlist:['text_sm','text_lightgrey','text_italic','','fit_content','mx_auto'],
                           text:'No matching file was found.'
                        })
                        img_block.replaceChildren(no_file_icon_img,msg)
                     }

                     // non 'root_folder' folder paths
                     if(field_value) {
                        field_element = create_div({
                           classlist:['break_words','text_grey','align_self_end','mt_auto','text_left','pb_0.5'],
                           text:truncate(field_value,300)
                        })
                        // we don't add immediately to Card, to preserve desired order
                        folder_path_block.append(field_element)
                     }
                     break

                  default:

                     // default text field
                     if(field_value) {
                        field_element = create_div({
                           classlist:['break_words','w_full'],
                           text:truncate(field_value,150)
                        })
                        text_block.append(field_element)
                     }
               }               
            })
         }
      }

      // future : sep. components?
      const ctrls = create_div({
         classlist:['card_ctrls','flex','justify_end','m_0','p_0.15','pb_0.5','pr_.5','cursor_auto','bg_lightgrey']
      })

      const context_menu_icon = icon(
         'menu_up',
         [{key:'data-id',value:item.id},{key:'width',value:'16px'},{key:'height',value:'16px'}],
         ['context_menu_btn','cursor_pointer']
      )
      ctrls.append(context_menu_icon)

      const context_menu = new CardContextMenu({
         id:item.id,
         title:item.title,
         deleted_at:item.deleted_at
      })
      text_block.append(context_menu.render())
      
      // assemble
      card.prepend(img_block)
      text_block.append(folder_path_block)
      card.append(
         text_block,
         ctrls
      )
      return card
   }

   // enable buttons/links displayed in the render
   actions = async() => {
      // to avoid proliferation of EventListeners, parent components handle Card events
   }

}



export default CollectionItemCard