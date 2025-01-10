import { app } from '../../../renderer.js'
import PageBanner from '../../PageBanner/PageBanner.js'
import CardGrid from '../../CardGrid/CardGrid.js'
import CollectionItemCard from '../../CollectionItemCard/CollectionItemCard.js'
import TagsNavList from '../TagsNavList/TagsNavList.js'
import PaginationNav from '../../PaginationNav/PaginationNav.js'
import { ui_display_number_as_str } from '../../../utilities/ui_strings.js'
import { create_section,create_div } from '../../../utilities/ui_elements.js'
import { init_card_img_loads,no_root_folder,has_valid_field_filter,no_root_elem } from '../../../utilities/ui_utilities.js'


// to do : break components eg Tags...  into sub-folders

class Tags {

   #props

   // Component container element
   #tags_section

   // pagination
   #pagination_nav

   // CardGrid object
   #card_grid

   // Cards grid container element
   #tags_results_container

   // CollectionItems list
   #items

   // TagsNavList object
   #tags_nav

   // Page Context (State)
   #context = {
      key:'Tags',
      field_filters:[{
         field:'tags',
         test:'LIKE',
         value:''
      }],
      page:1,
      scroll_y:0
   }
   
   #root_folder


   constructor(props) {
      if(props) this.#context = props.context
      this.#props = props
   }

   render = async() => {


      this.#root_folder = app.get_root_folder()
      if(this.#root_folder === '') return no_root_elem()

      this.#tags_section = create_section({
         attributes:[{key:'id',value:'tags_section'}],
         classlist:['px_1']
      })

      const page_banner = new PageBanner({
         icon_name:'tag',
         title:'Tags',
         lead:'Find all the tagged Records.'
      })

      const tags_nav = await this.add_tags_nav()

      const num_records = this.add_number_results()

      this.#pagination_nav = new PaginationNav()

      // grid wrapper
      this.#card_grid = new CardGrid({
         container_id:'tags_results_container',
         refresh:this.refresh,
         get_item:this.get_item
      })
      this.#tags_results_container = this.#card_grid.render()

      // re-instate tags_context on 'back'
      if(this.#context && has_valid_field_filter('tags',this.#context)) {
         const tags_filter = this.#context.field_filters.find(elem => {
            return elem.field === 'tags'
         })
         if(this.#tags_nav) this.#tags_nav.highlight_selected(tags_filter.value)
         this.#tags_results_container.append(this.get_items())
      }

      const tags_status = create_div({
         attributes:[{key:'id',value:'tags_status'}],
         classlist:['p_0','bg_warning']
      })

      window.scroll(0,0)

      // assemble
      this.#tags_section.append(
         page_banner.render(),
         tags_nav,
         num_records,
         this.#pagination_nav.render(),
         this.#tags_results_container,
         this.#pagination_nav.render(),
         tags_status
      )
      return this.#tags_section
   }

   // enable buttons/links displayed in the render
   activate = () => {
      init_card_img_loads()
      if(this.#card_grid) this.#card_grid.activate()
      if(this.#pagination_nav) this.#pagination_nav.activate() 
   }


   // retrieve the paginated Tags results 
   get_items = async () => {

      if(this.#context) {
         
         try {
            const collection_items_obj = await window.collection_items_api.getItems(this.#context)

            if (typeof collection_items_obj != "undefined") {
               if(collection_items_obj.outcome === 'success') {

                  this.#items = collection_items_obj.collection_items

                  this.#tags_results_container.replaceChildren()
                  
                  let page_count = Math.ceil(collection_items_obj.count / collection_items_obj.per_page)

                  if(collection_items_obj.collection_items && collection_items_obj.collection_items.length > 0) {

                     let number_records = document.getElementById('number_records')
                     if(number_records) {          
                        let {count} = collection_items_obj
                        number_records.innerText = `${ui_display_number_as_str(count)} matching record${count === 1 ? '' : 's'} ${count === 1 ? 'was found' : 'were found'}.`
                     }

                     // Tags Results Cards grid
                     let props = {
                        root_folder: this.#root_folder,
                        context:this.#context
                     }
                     const collection_item_card = new CollectionItemCard(props)
                     if(Array.isArray(collection_items_obj.collection_items)) {
                        for(const item of collection_items_obj.collection_items) { 
                           this.#tags_results_container.appendChild(collection_item_card.render(collection_items_obj.collection_item_fields,item))
                        }
                     }
         
                     // retain some spacing on short lists
                     this.#tags_results_container.style.minHeight = '70vh' 

                     const page_navs = document.querySelectorAll('.page_nav')
                     if(page_navs) {
                        page_navs.forEach(page_nav => {
                           page_nav.replaceWith(this.#pagination_nav.render({
                              key:'top',
                              callback:this.go_to_page,
                              page_count:page_count,
                              current_page:this.#context.page
                           }))
                        })
                     }
                  }
                  else {
                     let number_records = document.getElementById('number_records')
                     if(number_records) {             
                        number_records.innerText = 'No matching records were found. '
                     }
                  }
                  // re-instate scroll position if user had scrolled list before opening a record
                  setTimeout(() => window.scroll(0,this.#context.scroll_y),100)
               }
               else {
                  let tags_status = document.getElementById('tags_status')
                  if(tags_status) tags_status.innerText = collection_items_obj.message
               }
            }
            else {
               throw 'No results were returned.'
            }
         }
         catch(error) {
            app.switch_to_component('Error',{
               msg:'Sorry, we were unable to access the Records.',
               error:error
            },false)
         }
      }
      else {
         return null
      }
   }

   add_tags_nav = async(tag) => {
     
      let props = {
         tags_search_term:tag,
         submit_tag:this.submit_tag,
         clear_results:this.clear_results
      }
      this.#tags_nav = new TagsNavList(props)
      const tags_nav_elem = await this.#tags_nav.render()
      setTimeout(() => this.#tags_nav.activate(),50)
      if(tags_nav_elem) {
         return tags_nav_elem
      }
      else {
         return create_div({
            classlist:['bg_inform','p_1','fit_content','rounded','mx_2'],
            text:'There are no Tags configured in the system. You can add Tags in the Config menu.'
         })
      }
   }

   add_number_results = () => {
      return create_div({
         attributes:[{key:'id',value:'number_records'}],
         classlist:['p_.5','pt_1','text_center']
      })
   }

   // callback for TagsNavList
   submit_tag = (tag) => {
      if(tag) {         
         let target_filter = this.#context.field_filters.find(filter => filter.field === 'tags')
         if(target_filter) target_filter.value = tag
         this.#context.scroll_y = 0
      }
      this.get_items()
      setTimeout(() => this.activate(),200)
   }

   // callback for PageNavigation
   go_to_page = (page) => {
      this.#context.page = page
      this.#context.scroll_y = 0
      this.get_items()
      setTimeout(() => this.activate(),200)
   }

   clear_results = () => {
      if(this.#tags_results_container) {
         this.#tags_results_container.replaceChildren()
      }
      let number_records = document.getElementById('number_records')
      if(number_records) number_records.innerText = ''
   }

   // grid can request refresh
   refresh = () => {
      this.#context.scroll_y = window.scrollY
      this.get_items()
      setTimeout(() => this.activate(),100)
   }

   get_item = (id) => {
      return this.#items.find(item => {
         return item.id === parseInt(id)
      })
   }

   get_default_context = () => {
      return this.#context
   }

}

export default Tags