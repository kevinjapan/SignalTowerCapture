import { 
   create_section,
   create_form,
   create_button,
   create_input
} from '../../utilities/ui_elements.js'


class SearchForm {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      const search_results = create_section({
         classlist:['flex','mr_auto','w_400','p_0']
      })

      const search_form = create_form({
         attributes:[
            {key:'id',value:'search_form'}
         ]
      })

      let search_term_input = create_input({
         attributes:[
            {key:'id',value:'search_term_input'},
            {key:'name',value:'search_term'},
            {key:'type',value:'text'},
            {key:'value',value:this.#props.search_term},
         ],
         classlist:['input_field','m_1']
      })

      // to do : ensure btns are showing when selected on tab..  accessibility

      let search_btn = create_button({
         attributes:[
            {key:'id',value:'search_btn'}
         ],
         classlist:['flex','align_items_center','p_0','pl_1','pr_1'],
         text:'Search'
      }) 

      // magnifying glass icon
      let icon = document.createElementNS('http://www.w3.org/2000/svg','svg')
      icon.classList.add('pt_.5','ml_1','mt_0.5')
      const icon_path = document.createElementNS('http://www.w3.org/2000/svg','path')
      icon.setAttribute('width','16')
      icon.setAttribute('height','16')               
      icon_path.setAttribute('d','M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0')
      icon.appendChild(icon_path)
      search_btn.append(icon)


      // assemble
      search_form.append(search_term_input)
      search_results.append(search_form,search_btn)

      return search_results
   }

   // enable buttons/links displayed in the render
   activate = () => {

      const search_btn = document.getElementById('search_btn')
      
      if(search_btn) {
         search_btn.addEventListener('click',() => {
            let search_context = {
               key: 'Search',
               search_term:search_term_input.value,
               page:1
            }
            this.#props.submit_search_term(search_context)
         })
      }

      // Keydown on search term <input> element
      const search_term_input = document.getElementById('search_term_input')
      if(search_term_input) {

         search_term_input.addEventListener('keydown', async(event) => {

            if(event.key === 'Enter') {
               event.preventDefault()

               let search_context = {
                  search_term:search_term_input.value,
                  page:1
               }
               this.#props.submit_search_term(search_context)
            }
            const search_status = document.getElementById('search_status')
            if(search_status) {
               search_status.innerText = ''
            }
            // to do : when should we clear the search results?
            this.#props.clear_search()
         })

         // search_term_input.focus()
      }

   }
}


export default SearchForm