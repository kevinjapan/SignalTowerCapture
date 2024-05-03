import AdvancedSearch from '../AdvancedSearch/AdvancedSearch.js'
import { 
   create_section,
   create_form,
   create_button,
   create_input,
   create_h,
   create_div
} from '../../utilities/ui_elements.js'




class SearchForm {


   #props


   // advanced search changes register in filters obj
   #filters = {}


   constructor(props) {
      this.#props = props
   }

   render = () => {

      const search_form_wrap = create_section({
         classlist:['flex_col','ml_auto','mr_auto','w_full','p_0','text_center']
      })

      const search_form = create_form({
         attributes:[
            {key:'id',value:'search_form'}
         ],
         classlist:['flex','justify_center']
      })

      let search_term_input = create_input({
         attributes:[
            {key:'id',value:'search_term_input'},
            {key:'name',value:'search_term'},
            {key:'type',value:'text'},
            {key:'value',value:this.#props.search_term},
            {key:'maxlength',value:this.#props.search_term_max_len}
         ],
         classlist:['input_field','m_1']
      })
      search_form.append(search_term_input)

      let search_btn = create_button({
         attributes:[
            {key:'id',value:'search_btn'}
         ],
         classlist:['flex','align_items_center','p_0.75','pl_1','pr_1','mt_0.75'],
         text:'Search'
      }) 

      // magnifying glass btn icon
      let icon = document.createElementNS('http://www.w3.org/2000/svg','svg')
      icon.classList.add('pt_.5','ml_1','mt_0')
      const icon_path = document.createElementNS('http://www.w3.org/2000/svg','path')
      icon.setAttribute('width','16')
      icon.setAttribute('height','16')               
      icon_path.setAttribute('d','M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0')
      icon.appendChild(icon_path)
      search_btn.append(icon)


      // advanced search 
      let advanced_search_link = create_section({
         attributes:[
            {key:'id',value:'advanced_search_link'}
         ],
         classlist:['w_full','cursor_pointer'],
         text:'Advanced Search'
      })

      let advanced_search_dropdown = create_section({
         attributes:[
            {key:'id',value:'advanced_search_dropdown'}
         ]
      })

      
      let advanced_props = {
         filter_search:this.filter_search
      }

      const advanced_search = new AdvancedSearch(advanced_props)
      if(advanced_search_dropdown) {
         advanced_search_dropdown.append(advanced_search.render())
         setTimeout(() => advanced_search.activate(),200)
      }

      // assemble
      let form_n_btn = create_div({
         classlist:['flex','w_full']
      })
      search_form.append(search_btn)
      form_n_btn.append(search_form)
      search_form_wrap.append(form_n_btn,advanced_search_link,advanced_search_dropdown)
      return search_form_wrap
   }

   // enable buttons/links displayed in the render
   activate = () => {

      const search_btn = document.getElementById('search_btn')
      
      // click 'Search' btn
      if(search_btn) {
         search_btn.addEventListener('click',(event) => {

            event.preventDefault()
            let search_context = {
               key: 'Search',
               search_term:search_term_input.value,
               page:1,
               filters:this.#filters
            }
            this.#props.submit_search_term(search_context)
         })
      }

      // Keydown on search_term <input> element
      const search_term_input = document.getElementById('search_term_input')
      if(search_term_input) {

         search_term_input.addEventListener('keydown', async(event) => {

            if(event.key === 'Enter') {
               event.preventDefault()

               let search_context = {
                  key: 'Search',
                  search_term:search_term_input.value,
                  page:1,
                  filters:this.#filters
               }
               this.#props.submit_search_term(search_context)
            }
            const search_status = document.getElementById('search_status')
            if(search_status) {
               search_status.innerText = ''
            }
            this.#props.clear_search()
         })

      }

      // Advanced Search 'dropdown'
      const advanced_search_link = document.getElementById('advanced_search_link')
      if(advanced_search_link) {

         advanced_search_link.addEventListener('click',() => {
            
            const advanced_search = document.getElementById('advanced_search')
            if(advanced_search) {
               advanced_search.classList.toggle('hidden')
            }
         })
      }
      search_term_input.focus()
   }

   
   // callback for AdvancedSearch
   filter_search = (filters) => {
      // register changes in AdvancedSearch 
      let filter_keys = Object.keys(filters) 
      filter_keys.forEach((key) => {
         this.#filters[key] = filters[key]
      })
   }
}


export default SearchForm