import App from '../App/App.js'
import TagsLiteList from '../TagsLiteList/TagsLiteList.js'
import { get_ui_ready_date } from '../../utilities/ui_datetime.js'
import { create_section,create_div,create_h } from '../../utilities/ui_elements.js'
import { trim_char,trim_end_char } from '../../utilities/ui_strings.js'
import { is_image_file, build_img_elem } from '../../utilities/ui_utilities.js'



class CollectionItemCard {

   #props

   constructor(props) {
      this.#props = props
   }

   render = (fields,item) => {
      
      // 'fields' is an array including keys of properties in the 'item' and preserves the display order
      // card is row flex to align minor fields at foot while primary fields occupy flex_100 (width 100%)
      let card = create_section({
         classlist:['collection_item_card','flex','gap_0.5']
      })

      let text_col = create_div()

      let img_col = create_div({
         classlist:['pl_1']
      })
      
      let field_element
      let tags_list_elem

      if(typeof item !== 'undefined') {

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
                  attributes: [
                     {key:'data-id',value:item.id}
                  ],
                  classlist:['text_blue','card_title_link','flex_100','m_0','font_w_400','cursor_pointer','hover_line','break_words'],
                  text:field_value
               })
               text_col.append(field_element)
            }
            else if(field.key === 'file_type') {
               field_element = create_div({
                  classlist:['flex_100'],
                  text:field_value
               })
               text_col.append(field_element)
            }
            else if(field.key === 'file_name') {

               let file_name = field_value
            
               // display file icon
               let file_name_block = create_div({
                  classlist:['flex','gap_.5','mt_0.25','flex_100','break_words']
               })
               field_element = create_div({
                  classlist:['pt_0.3'],
                  text:field_value
               })
               let icon = document.createElementNS('http://www.w3.org/2000/svg','svg')            
               icon.classList.add('pt_.5')
               const icon_path = document.createElementNS('http://www.w3.org/2000/svg','path')
               icon.setAttribute('width','16')
               icon.setAttribute('height','16')               
               icon_path.setAttribute('d','M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1')
               icon.appendChild(icon_path)
               file_name_block.append(icon,field_element)
               text_col.append(file_name_block)
      
            }         
            else if(field.key === 'folder_path') {

               // Card image               
               // build the file_path
               const root_part = trim_end_char(this.#props.root_folder,'\\')
               const relative_folder_part = trim_char(item.folder_path,'\\')
               const file_part = item.file_name
               const file_path = `${root_part}\\${relative_folder_part}\\${file_part}`

               // we inject placeholder and load img jit w/ intersection observer
               const placeholder_file_path = `imgs\\card_img_placeholder.jpg`

               if(await is_image_file(file_path)) { 
                  let img = await build_img_elem(item.id,placeholder_file_path,item.img_desc,
                     [{key:'data-id',value:item.id},{key:'data-src',value:file_path}],
                     ['record_card_image','card_title_link','cursor_pointer']
                  )
                  if(img) {
                     img_col.replaceChildren(img)
                  }
                  
               }
               else {
                  img_col.append(create_div(),document.createTextNode('No image file was found.'))
               }            
            }
            else if(field.key === 'tags') {
               tags_list_elem = create_div({
                  attributes:[
                     {key:'id',value:'tags_list_elem'}
                  ],
                  classlist:['m_0','w_full']
               }) 
               if(item.tags) {
                  const tags_list = new TagsLiteList('tags_list')
                  if(tags_list) {
                     tags_list_elem.append(await tags_list.render(item.tags.split(','),this.actions))
                     setTimeout(() => tags_list.activate(),100)
                  }
               }
               text_col.append(tags_list_elem)
            }
            else {
               // default field display
               // content_desc occuppies row itself since it is btwn title and file_name (both 'flex_100' above)
               if(field_value) {
                  if(field_value.length > 500) field_value = field_value.substring(0,500) + '..'
                  field_element = create_div({
                     classlist:['break_words','mt_0.5','mr_2'],
                     text:field_value
                  })
                  text_col.append(field_element)
               }
            }
         })
      }
      card.append(img_col,text_col)
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

                     if (typeof collection_item_obj != "undefined") {
                        if(collection_item_obj.outcome === 'success') {

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
                           throw 'No records were returned.'
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