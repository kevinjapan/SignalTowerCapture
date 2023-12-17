import { create_section,create_div } from '../../utilities/ui_elements.js'



class PaginationNav {

   // the key allows us to distinguish btwn multiple PaginationNav on same view
   #key

   // total page count for client list
   #page_count = []
   
   // the current pages
   #current_page = 1

   // function to request prev/next page in client lists
   #callback


   constructor(key,callback,page_count,current_page) {  
      if(Number.isInteger(parseInt(page_count))) {
         this.#page_count = Array(page_count).fill(0)
      }     
      if(Number.isInteger(parseInt(current_page))) {
         this.#current_page = current_page
      }
      this.#key = key
      this.#callback = callback
   }


   render = () => {

      // container
      let nav = create_section({
         attributes:[
            {key:'id',value:'nav'}
         ],
         classlist:['page_nav','flex', 'space_between', 'gap_.5']
      })
      
      // the links
      const prev_link = create_div({
         attributes:[
            {key:'data-page',value:parseInt(this.#current_page) - 1}
         ],
         classlist:this.#current_page > 1 ? [`${this.#key}_page_selector`,'page_selector'] : ['text_grey'],
         text: '< previous page'
      })
      const now_link = create_div({
         attributes:[
            {key:'data-page',value:parseInt(this.#current_page)}
         ],
         classlist:['page_selector'],
         text: `page ${this.#current_page} of ${this.#page_count.length}`
      })
      const next_link = create_div({
         attributes:[
            {key:'data-page',value:parseInt(this.#current_page) + 1}
         ],
         classlist:this.#current_page < this.#page_count.length ? [`${this.#key}_page_selector`,'page_selector'] : ['text_grey'],
         text: 'next page >'
      })

      // assemble
      nav.append(prev_link,now_link,next_link)
      return nav
   }

   activate = () => {
      const page_selectors = document.querySelectorAll(`.${this.#key}_page_selector`)
      if(page_selectors) {
         page_selectors.forEach((page_selector) => {
            page_selector.addEventListener('click', async(event) => {
               if(page_selector.attributes['data-page']) {
                  this.#callback(page_selector.attributes['data-page'].value,false)
               }
            })
         })
      }
   }
}


export default PaginationNav