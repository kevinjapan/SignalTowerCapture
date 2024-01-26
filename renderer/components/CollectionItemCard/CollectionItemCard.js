import App from '../App/App.js'
import TagsLiteList from '../TagsLiteList/TagsLiteList.js'
import { get_ui_ready_date } from '../../utilities/ui_datetime.js'
import { create_section,create_div,create_h } from '../../utilities/ui_elements.js'
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
         classlist:['CollectionItemCard','flex','gap_0.5']
      })
      
      let field_element
      let tags_list_elem
      let file_name
 
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
               classlist:['text_blue','card_title_link','flex_100','m_0','font_w_400','cursor_pointer','hover_line'],
               text:field_value
            })
            card.append(field_element)

         }
         else if(field.key === 'file_name') {

            file_name = field_value
         
            // display file icon
            let file_name_block = create_div({
               classlist:['flex','gap_.5','mt_0.25','flex_100']
            })
            field_element = create_div({
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
            card.append(file_name_block)

         }
         
         // else if(field.key === 'folder_path') {

            // if(file_name) {               
            //    if(await is_image_file(field_value,file_name)) { 
            //       let img = await build_img_elem('record_img',field_value,file_name)
            //       if(img) {
            //          card.append(img)
            //       }
            //    }
            //    else {
            //       card.append(create_div(),document.createTextNode('No image file was found.'))
            //    }
            // }
         // }
         else if(field.key === 'tags') {

            tags_list_elem = create_div({
               attributes:[
                  {key:'id',value:'tags_list_elem'}
               ],
               classlist:['m_0','w_full']
            }) 
            const tags_list = new TagsLiteList('tags_list')
            if(tags_list) {
               tags_list_elem.append(await tags_list.render(item.tags.split(','),this.actions))
               setTimeout(() => tags_list.activate(),100)
            }
            card.append(tags_list_elem)

         }

         else {

            // default field display
            // content_desc occuppies row itself since it is btwn title and file_name (both 'flex_100' above)

            if(field_value.length > 500) field_value = field_value.substring(0,500) + '..'

            field_element = create_div({
               classlist:['break_words','mt_0.5','mr_2'],
               text:field_value
            })
            card.append(field_element)
         }
      })

      return card
   }

   // enable buttons/links displayed in the render
   activate = async() => {

      // Card Title link to record
         
      const card_title_links = document.querySelectorAll('.card_title_link')
   
      if(card_title_links) {
   
         card_title_links.forEach((card_title_link) => {

            card_title_link.addEventListener('click', async(event) => {
               
               if(typeof card_title_link.attributes['data-id'] !== 'undefined') {

                  const sep = await window.files_api.filePathSep()

                     try {
                        const collection_item_obj = await window.collection_items_api.getCollectionItem(card_title_link.attributes['data-id'].value)

                        if (typeof collection_item_obj != "undefined") {
                           if(collection_item_obj.outcome === 'success') {

                              let component_container = document.getElementById('component_container')
                              if(component_container) {

                                 // get search context to inject scroll_y
                                 let context = this.#props.context ? this.#props.context : null

                                 let props = {
                                    fields:collection_item_obj.collection_item_fields,
                                    item:collection_item_obj.collection_item,
                                    context:context ? {...context,scroll_y:window.scrollY} : null
                                 }
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
                        msg:'Sorry, no valid id was provided for the Collection Item.',
                        error:error
                     }
                     App.switch_to_component('Error',props)
                  }
            })
         })
      }
   }


   actions = async(key,id) => {
      console.log('actions')
   }

}



export default CollectionItemCard