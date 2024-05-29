import { icon } from '../../utilities/ui_utilities.js'
import { create_div,create_button } from '../../utilities/ui_elements.js'



// to do : once this is working correctly (and we can step 'back' from Record to correct paginated list state)
//         - then we can remove 'back' btn from all components themselves.


class History {

   // we store 'context' list for visited pages
   #visited_pages = []

   // 'tape' head tracks index position on #visited_pages
   #head = -1

   // avoid proliferation, capture most use cases
   #max_pages = 5 // to do : set to, say, 20 (will cover 90% of use cases)

   // app API to switch component page
   #switch_to_component


   constructor(switch_component_callback) {
      this.#switch_to_component = switch_component_callback
   }

   render = () => {

      const history_component = create_div({
         attributes:[{key:'id',value:'history_component'}],
         classlist:['flex','align_items_center','text_white']
      })
      
      const back_btn = icon('history_back',[{key:'id',value:'back_btn'}],['cursor_pointer','tester'])

      const clear_btn = create_button({
         attributes:[{key:'id',value:'clear_btn'}],
         classlist:[],
         text:'clr'
      })

      // future : can we programmatically change icon to white fill (currently we copied/modified svg file - see icon())
      const forward_btn = icon('history_forward',[{key:'id',value:'forward_btn'}],['cursor_pointer'])

      history_component.append(back_btn,clear_btn,forward_btn)
      return history_component
   }
   
   async activate(callback) {

      let back_btn = document.getElementById('back_btn')
      if(back_btn) back_btn.addEventListener('click',this.back)

      let forward_btn = document.getElementById('forward_btn')
      if(forward_btn) forward_btn.addEventListener('click',this.forward)

      let clear_btn = document.getElementById('clear_btn')
      if(clear_btn) clear_btn.addEventListener('click',this.clear)
   }

   back = () => {
      if(this.#head <= 0) return false
      this.#head--
      const page = this.#visited_pages[this.#head]
      if(page && page.key) this.#switch_to_component(page.key,page ? {context:page} : '',false)
   }

   forward = () => {
      if(this.#head >= this.#visited_pages.length - 1) return false
      this.#head++
      const page = this.#visited_pages[this.#head]
      if(page && page.key) this.#switch_to_component(page.key,page ? {context:page} : '',false)
   }

   add_visited_page = (component_name,props) => {

      if(component_name === '') return false

      // to do : don't add if same page clicked (except if pagination?) - better disable click on nav? (but native navigation?)
      // to do : only add if different from current page! (click is still enabled)

      // shift history if max pages reached
      if(this.#visited_pages.length > this.#max_pages - 1) this.#visited_pages.shift()

      // to do : we may need to add pagination navigation links, 'next page' etc, to history
      //         try add to Pagination component (will carry to Browse/Search/Recent etc)

      // if no props, we register page w/ no context
      if(!props || props === 'undefined' || props.context === 'undefined') {
         this.#visited_pages.push({key:component_name})
      }
      else {
         this.#visited_pages.push(props)
      }

      // 'tape' head may not be at last index
      this.#head < this.#max_pages - 1 ? this.#head++ : this.#head = this.#max_pages - 1

      // console.log(`head [${this.#head}]`,this.#visited_pages) // to do : verify working correctly
   }

   //
   // purge all later pages in history
   // user has clicked back through history, then clicked a new page - all 'newer' pages are discarded
   //
   remove_visited_page = (new_length) => {
      //         
      //         
      // this.#visited_pages
      
      // 'tape' head may not be at last index
      // this.#head++
   }

   clear = () => {
      this.#visited_pages = []
      this.#head = -1

      // to do : consider for this (and other operations) we have to update UI (render func)
   }

}


export default History