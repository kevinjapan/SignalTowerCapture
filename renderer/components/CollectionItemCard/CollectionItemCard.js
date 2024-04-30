import App from '../App/App.js'
import TagsLiteList from '../TagsLiteList/TagsLiteList.js'
import { is_valid_response_obj } from '../../utilities/ui_response.js'
import { get_ui_ready_date } from '../../utilities/ui_datetime.js'
import { create_section,create_div,create_h } from '../../utilities/ui_elements.js'
import { trim_char,trim_end_char,truncate } from '../../utilities/ui_strings.js'
import { get_ext,is_img_ext,get_file_type_img,get_file_type_icon,file_exists,build_img_elem } from '../../utilities/ui_utilities.js'


class CollectionItemCard {

   #props

   constructor(props) {
      this.#props = props
   }

   render = (fields,item) => {
      
      // 'fields' is an array including keys of properties in the 'item' and preserves the display order
      // card is row flex to align minor fields at foot while primary fields occupy flex_100 (width 100%)
      let card = create_section({
         classlist:['collection_item_card']
      })

      let img_block = create_div({
         classlist:['image_block','text_center','m_auto']
      })
      let tags_block = create_div({classlist:['flex','no_wrap']})
      let folder_path_block = create_div()

      // let icons_block = create_div({
      //    classlist:['flex','mb_1']
      // })
      
      let field_element
      let tags_list_elem

      if(typeof item !== 'undefined') {

         if(Array.isArray(fields)) {
            
            fields.forEach(async(field) => {

               // field value
               let field_value = item[field.key]
               if(field.test.type === 'date') {
                  field_value = get_ui_ready_date(field_value)
               }

               if(field.key === 'title') {

                  // title as link
                  //
                  if(field_value === '') field_value = 'no title'
                  field_element = create_h({
                     level:'h3',
                     attributes: [
                        {key:'data-id',value:item.id}
                     ],
                     classlist:['text_blue','card_title_link','flex_100','m_0','mt_0.5','mb_0.5','font_w_400','cursor_pointer','hover_line','break_words'],
                     text:field_value
                  })
                  card.append(field_element)
               }
               else if(field.key === 'file_type') {

                  // CollectionItem.file_type is 'file' | 'folder'
                  //

                  let file_type_block = create_div({
                     classlist:['flex','align_items_center','gap_.5','mt_0.25','p_0.5','break_words']
                  })
                  field_element = create_div({
                     classlist:['pt_0.3'],
                     text:field_value
                  })
                  const icon = field_value.toUpperCase() === 'FILE' ? 'imgs\\filetypes\\file.svg' : 'imgs\\icons\\folder.svg'
                  
                  const ext = get_ext(field_value)

                  const file_type = build_img_elem(icon,`${ext} filetype`,[{key:'height',value:'24px'}],[]) 
                  file_type_block.append(file_type,field_element)

                  // append
                  card.append(file_type_block)
               }
               else if(field.key === 'file_name') {
               
                  // Bootstrap icons are 'filetype-xxx.svg' - so 'filetype' here refers to eg 'PDF' | 'TXT' | ...
                  //

                  let file_ext_type_block = create_div({
                     classlist:['flex','align_items_center','gap_.5','mt_0.25','fit_content','p_0.5','break_words','no_wrap','w_full']
                  })
                  field_element = create_div({
                     classlist:['pt_0.3'],
                     text:field_value
                  })

                  const icon = get_file_type_icon(field_value)
                  const ext = get_ext(field_value)
                  const filetype_icon = build_img_elem(icon,`${ext} filetype`,[{key:'height',value:'24px'}],[])
                  file_ext_type_block.append(filetype_icon,field_element)

                  // append
                  card.append(file_ext_type_block)
               }         
               else if(field.key === 'folder_path') {

                  // Card image               
                  // 
                  const root_part = trim_end_char(this.#props.root_folder,'\\')
                  let relative_folder_part = trim_char(item.folder_path,'\\')
                  
                  // allow for empty folder_path (files in root_folder)
                  if(relative_folder_part !== '') relative_folder_part += '\\'

                  const file_part = item.file_name
                  const file_path = `${root_part}\\${relative_folder_part}${file_part}`

                  // we inject placeholder and load img jit w/ intersection observer
                  const placeholder_file_path = `imgs\\card_img_placeholder.jpg`

                  // wrapper to permit full width while cropping tall images
                  const record_card_image_wrap = create_div({
                     classlist:['record_card_image_wrap']
                  })

                  if(await file_exists(file_path)) {

                     if(is_img_ext(file_part)) {
                        // process img file
                        let img = build_img_elem(placeholder_file_path,item.img_desc,
                           [{key:'data-id',value:item.id},{key:'data-src',value:file_path}],
                           ['record_card_image','card_title_link','cursor_pointer']
                        )
                        if(img) {
                           record_card_image_wrap.append(img)
                           img_block.replaceChildren(record_card_image_wrap)
                        }
                     }
                     else {
                        // process non-img file
                        const icon_img_file_path = get_file_type_img(file_part)
                        const ext = get_ext(file_path)
                        let img = build_img_elem(icon_img_file_path,`${ext} file icon`,
                           [{key:'data-id',value:item.id},{key:'data-src',value:icon_img_file_path},{key:'height',value:'40px'}],
                           ['record_card_image','card_title_link','cursor_pointer','pt_1']
                        )
                        if(img) {
                           record_card_image_wrap.append(img)
                           img_block.replaceChildren(record_card_image_wrap)
                        }
                     }                  
                  }
                  else {
                     const no_file_icon_img = build_img_elem('imgs\\icons\\exclamation-square.svg',`item date`,[{key:'height',value:'24px'}],['bg_yellow_100','mt_1','opacity_.6'])
                     img_block.append(no_file_icon_img)
                     let msg = create_div({
                        classlist:['text_sm','text_grey','text_italic'],
                        text:'No matching file was found.'
                     })
                     img_block.append(msg)
                  }    

                  if(field_value) {
                     field_element = create_div({
                        classlist:['break_words','mt_0.5','mr_2','p_1','text_grey'],
                        text:truncate(field_value,300)
                     })
                     folder_path_block.append(field_element)
                  }
               }
               else if(field.key === 'tags') {

                  // Tags
                  //
                  const tags_label = create_div({
                     classlist:['mt_1','p_0.5','pt_0.75','text_grey'],
                     text:'Tags'
                  })

                  tags_list_elem = create_div({
                     attributes:[
                        {key:'id',value:'tags_list_elem'}
                     ],
                     classlist:['flex','align_items_center','m_0','pl_0.5','gap_1']
                  }) 
                  if(item.tags) {
                     const tags_list = new TagsLiteList('tags_list')
                     if(tags_list) {
                        tags_list_elem.append(await tags_list.render(item.tags,this.actions))
                        setTimeout(() => tags_list.activate(),100)
                     }
                  }
                  tags_block.append(tags_label,tags_list_elem)
               }
               else if(field.key === 'item_date') {
                  
                  // item date
                  //

                  if(field_value) {
                     let item_date_block = create_div({
                        classlist:['flex','align_items_center','gap_.5','mt_0.25','fit_content','p_0.5','break_words','w_full']
                     })
                     field_element = create_div({
                        classlist:['pt_0.3','break_words'],
                        text:field_value
                     })
                     const filetype_icon = build_img_elem('imgs\\icons\\calendar.svg',`item date`,[{key:'height',value:'24px'}],[])
                     item_date_block.append(filetype_icon,field_element)

                     // append
                     card.append(item_date_block)
                  }


               }
               else {

                  // Default field display
                  //

                  if(field_value) {
                     field_element = create_div({
                        classlist:['break_words','pb_1','w_full'],
                        text:truncate(field_value,300)
                     })
                     card.append(field_element)
                  }
               }
            })
         }
      }
      
      // assemble
      // text_block.insertBefore(icons_block, text_block.children[2])
      card.prepend(img_block)
      card.append(folder_path_block,tags_block)
      return card
   }

   
   // enable buttons/links displayed in the render
   activate = async() => {

      // Card Title link to record         
      const card_title_links = document.querySelectorAll('.card_title_link')   
      if(card_title_links) {
   
         card_title_links.forEach(card_title_link => {

            card_title_link.addEventListener('click', async(event) => {

               if(typeof card_title_link.attributes['data-id'] !== 'undefined') {

                  try {
                     const collection_item_obj = await window.collection_items_api.getCollectionItem(card_title_link.attributes['data-id'].value)

                     if (typeof collection_item_obj != "undefined" && collection_item_obj.outcome === 'success') {

                        if(await is_valid_response_obj('read_single_collection_item',collection_item_obj)) {
                        
                           let component_container = document.getElementById('component_container')
                           if(component_container) {

                              let props = {
                                 fields:collection_item_obj.collection_item_fields,
                                 item:collection_item_obj.collection_item,
                                 ...this.#props
                              }
                              props.context.scroll_y = window.scrollY
                              App.switch_to_component('Record',props)
                           }
                        }
                        else {
                           App.switch_to_component('Error',{
                              msg:'Sorry, we were unable to process an invalid response from the main process in CollectionItemCard.'
                           })
                        }
                     }
                     else {
                        throw 'No records were returned.'
                     }
                  }
                  catch(error) {
                     let props = {
                        msg:'Sorry, we were unable to access the Records',
                        error:error
                     }
                     App.switch_to_component('Error',props)
                  }
               }
               else {
                  let props = {
                     msg:'Sorry, no valid id was provided for the Collection Item.'
                  }
                  App.switch_to_component('Error',props)
               }
            })
         })
      }
   }

   actions = async(key,id) => {
      
   }

}



export default CollectionItemCard