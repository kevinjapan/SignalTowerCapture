import { get_ui_ready_date } from '../../utilities/ui_datetime.js'
import { create_section,create_div,create_h } from '../../utilities/ui_elements.js'
import { trim_char,trim_end_char,truncate } from '../../utilities/ui_strings.js'
import { get_ext,is_img_ext,get_file_type_img,get_file_type_icon,file_exists,build_img_elem } from '../../utilities/ui_utilities.js'



// future : there is issue w/ page rendering/reflow because of large imgs (we don't have scope to generate thumbnails)
//          for example, some card row blocks re-render on scrolling the page - but most of the time, not noticeable
//          we have specified img and container dimensions, better but still a little awkward.



class CollectionItemCard {

   #props

   constructor(props) {
      this.#props = props
   }

   render = (fields,item) => {
      
      // 'fields' is an array including keys of properties in the 'item' and preserves the display order
      // card is row flex to align minor fields at foot while primary fields occupy flex_100 (width 100%)

      let card = create_section({
         attributes:[{key:'data-id',value:item.id}],
         classlist:['collection_item_card','cursor_pointer']
      })

      // primary layout
      let img_block = create_div({
         classlist:['card_image_block','text_center','m_0']
      })
      let text_block = create_div({
         classlist:['card_text_block','grid_card_text_layout','pl_0.5','pr_0.5','flex','flex_col','align_items_start','no_wrap','justify_end']
      })

      let tags_block = create_div({classlist:['flex','no_wrap']})
      let folder_path_block = create_div()
      
      let field_element
      // let tags_list_elem

      //
      // process each Card row (field)
      //
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
                  if(field_value === '') field_value = 'no title'
                  field_element = create_h({
                     level:'h3',
                     attributes: [{key:'data-id',value:item.id}],
                     classlist:['text_blue','card_title_link','flex_100','m_0','font_w_400','cursor_pointer','hover_line','break_words'],
                     text:field_value
                  })
                  text_block.append(field_element)
               }
               else if(field.key === 'file_type') {
                  // CollectionItem.file_type is 'file' | 'folder'
                  let file_type_block = create_div({
                     classlist:['flex','align_items_center','gap_.5','p_0.5','pl_0','break_words']
                  })
                  field_element = create_div({
                     classlist:['pt_0.3'],
                     text:field_value
                  })
                  const icon = field_value.toUpperCase() === 'FILE' ? 'imgs\\filetypes\\file.svg' : 'imgs\\icons\\folder.svg'
                  const ext = get_ext(field_value)
                  const file_type = build_img_elem(icon,`${ext} filetype`,[{key:'height',value:'24px'}],[]) 
                  file_type_block.append(file_type,field_element)
                  // text_block.append(file_type_block)
               }

               else if(field.key === 'file_name') {               
                  // Bootstrap icons are 'filetype-xxx.svg' - so 'filetype' here refers to eg 'PDF' | 'TXT' | ...
                  let file_ext_type_block = create_div({
                     classlist:['flex','align_items_center','gap_.5','fit_content','p_0.5','pl_0','break_words','no_wrap']
                  })
                  field_element = create_div({
                     classlist:['pt_0.3'],
                     text:field_value
                  })
                  const icon = get_file_type_icon(field_value)
                  const ext = get_ext(field_value)
                  const filetype_icon = build_img_elem(icon,`${ext} filetype`,[{key:'height',value:'24px'}],[])
                  file_ext_type_block.append(filetype_icon,field_element)
                  text_block.append(file_ext_type_block)
               }

               else if(field.key === 'folder_path') {
                  // Card image
                  const root_part = trim_end_char(this.#props.root_folder,'\\')
                  let relative_folder_part = trim_char(item.folder_path,'\\')
                  
                  // allow for empty folder_path (files in root_folder)
                  if(relative_folder_part !== '') relative_folder_part += '\\'

                  const file_part = item.file_name
                  const file_path = `${root_part}\\${relative_folder_part}${file_part}`

                  // we inject placeholder and load img JIT w/ intersection observer (init_card_img_loads() in ui_utilities.js)
                  const placeholder_file_path = `imgs\\card_img_placeholder.jpg`

                  // wrapper to permit full width while cropping tall images
                  const record_card_image_wrap = create_div({
                     classlist:['record_card_image_wrap']
                  })

                  // we load first row (4 images) immediately to force grid to start assuming footprint on first render
                  // while further rows' images are loaded using Intersection Observer - init_card_img_loads()
                  // we use placeholders to generate layout in good time (avoiding patchy rendering) below the fold
                  // - allowing user to view and read Card text while still waiting for images to load
                  // - we may 'overwrite' placeholder w/ 'no matching file..', but UX payoff is worth it
                  // - placeholder blur won't appear on first row - but layout is good and as quick as we can make it
                  const img_file_path = this.#props.card_index < 4 ? file_path : placeholder_file_path

                  if(is_img_ext(file_part)) {
                     // process img file
                     let img = build_img_elem(img_file_path,item.img_desc,
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
                        img_block.replaceChildren(record_card_image_wrap)     // to do : currently tied to file_exists() check above
                     }
                  }
                  else {
                     // process non-img file
                     const icon_img_file_path = get_file_type_img(file_part)
                     const ext = get_ext(file_path)
                     let img = build_img_elem(icon_img_file_path,`${ext} file icon`,
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

                  if(!await file_exists(file_path)) {
                     const no_file_icon_img = build_img_elem('imgs\\icons\\exclamation-square.svg',`item date`,[{key:'height',value:'24px'}],['bg_yellow_100','mt_5','opacity_.6'])
                     let msg = create_div({
                        classlist:['text_sm','text_lightgrey','text_italic','','fit_content','mx_auto'],
                        text:'No matching file was found.'
                     })
                     img_block.replaceChildren(no_file_icon_img,msg)
                  }
                  if(field_value) {
                     field_element = create_div({
                        classlist:['break_words','text_grey','align_self_end','mt_auto'],
                        text:truncate(field_value,300)
                     })
                     // we don't add immediately to Card, to preserve desired order
                     folder_path_block.append(field_element)
                  }
               }

               else if(field.key === 'tags') {

                  // to do : remove tags (or disable) - currently working (overhead) but no UI
                  // const tags_label = create_div({
                  //    classlist:['p_0.5','pt_0.75','text_grey'],
                  //    text:'Tags'
                  // })
                  // tags_list_elem = create_div({
                  //    attributes:[{key:'id',value:'tags_list_elem'}],
                  //    classlist:['flex','align_items_center','m_0','pl_0.5','pt_.25','gap_1']
                  // }) 
                  // if(item.tags) {
                  //    const tags_list = new TagsLiteList('tags_list')
                  //    if(tags_list) {
                  //       tags_list_elem.append(await tags_list.render(item.tags,this.actions))
                  //       setTimeout(() => tags_list.activate(),100)
                  //    }
                  // }
                  // tags_block.append(tags_label,tags_list_elem)
               }

               else if(field.key === 'item_date') {
                  // if(field_value) {
                  //    let item_date_block = create_div({
                  //       classlist:['flex','align_items_center','gap_.5','fit_content','p_0.5','break_words','w_full']
                  //    })
                  //    field_element = create_div({
                  //       classlist:['pt_0.3','break_words'],
                  //       text:field_value
                  //    })
                  //    const filetype_icon = build_img_elem('imgs\\icons\\calendar.svg',`item date`,[{key:'height',value:'24px'}],[])
                  //    item_date_block.append(filetype_icon,field_element)
                  //    // text_block.append(item_date_block)
                  // }
               }
               else {
                  // Default field display
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
      
      // assemble
      card.prepend(img_block)
      text_block.append(folder_path_block,tags_block)
      card.append(text_block)
      return card
   }

   
   // enable buttons/links displayed in the render
   // to avoid proliferation of EventListeners, parent components handle Card events
   // activate = async() => {}

   actions = async(key,id) => {}

}



export default CollectionItemCard