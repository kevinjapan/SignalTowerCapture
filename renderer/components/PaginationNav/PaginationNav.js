import { create_section,create_div } from '../../utilities/ui_elements.js'



class PaginationNav {

   #props
   
   // the key allows us to distinguish btwn multiple PaginationNav on same view
   #key

   // total page count for client list
   #page_count = []
   
   // the current pages
   #current_page = 1

   // function to request prev/next page in client lists
   #callback


   render = (props) => {

      if(props) {
         if(Number.isInteger(parseInt(props.page_count))) {
            this.#page_count = Array(props.page_count).fill(0)
         }     
         if(Number.isInteger(parseInt(props.current_page))) {
            this.#current_page = props.current_page
         }
         this.#key = props.key ? props.key : null
         this.#callback = props.callback ? props.callback : null
      }

      // container
      let page_nav = create_section({
         attributes:[{key:'id',value:'page_nav'}],
         classlist:['page_nav','max_w_full']
      })

      if(parseInt(this.#page_count.length) > 0) {

         // prev page
         const prev_link = create_div({
            attributes:[{key:'data-page',value:parseInt(this.#current_page) - 1}],
            classlist:this.#current_page > 1 ? [`${this.#key}_page_selector`,'page_selector'] : ['text_lightgrey'],
            text: '< prev page'
         })

         // page n of n
         const now_link = create_div({
            attributes:[{key:'data-page',value:parseInt(this.#current_page)}],
            classlist:['page_selector','text_grey'],
            text: `page ${this.#page_count.length > 0 ? this.#current_page : '0'} of ${this.#page_count.length}`
         })

         // next page
         const next_link = create_div({
            attributes:[{key:'data-page',value:parseInt(this.#current_page) + 1}],
            classlist:this.#current_page < this.#page_count.length ? [`${this.#key}_page_selector`,'page_selector'] : ['text_lightgrey'],
            text: 'next page >'
         })

         // assemble
         page_nav.append(prev_link,now_link,next_link)
      }

      return page_nav
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