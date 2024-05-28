import { app } from '../../renderer.js'
import { create_div,create_button } from '../../utilities/ui_elements.js'


// to do : once this is working correctly (and we can step 'back' from Record to correct paginated list state)
//         - then we can remove 'back' btn from all components themselves.

class History {

   // we store 'context' list for visited pages
   #visited_pages = []

   // head pointer position on #visited_pages
   #head = 0

   #max_pages = 5 // to do : set to, say, 20 (will cover 90% of use cases)

   #switch_to_component


   constructor(switch_component_callback) {
      this.#switch_to_component = switch_component_callback
   }

   render = () => {
      const history_component = create_div({
         attributes:[{key:'id',value:'history_component'}],
         classlist:['flex','align_items_center']
      })
      // to do : assign icons w/ alt text             
      const back_btn = create_button({
         attributes:[{key:'id',value:'back_btn'}],
         classlist:[],
         text:'back'
      })
      const forward_btn = create_button({
         attributes:[{key:'id',value:'forward_btn'}],
         classlist:[],
         text:'forward'
      })
      history_component.append(back_btn,forward_btn)
      return history_component
   }
   
   async activate(callback) {

      let back_btn = document.getElementById('back_btn')
      if(back_btn) {
         back_btn.addEventListener('click',this.back)
      }
      
      let forward_btn = document.getElementById('forward_btn')
      if(forward_btn) {
         forward_btn.addEventListener('click',this.forward)
      }
   }

   back = () => {
      if(this.#head <= 0) return false

      // 'tape' head tracks index
      this.#head--

      const page = this.#visited_pages[this.#head]

      console.log('page',page)
      
      this.#switch_to_component('',{})

   }

   forward = () => {
      if(this.#head >= this.#visited_pages.length - 1) return false

      // 'tape' head tracks index
      this.#head++
   }

   add_visited_page = (component_name,props) => {

      if(component_name === '') return false

      // to do : don't add if same page clicked (except if pagination?)

      // shift history if max pages reached
      if(this.#visited_pages.length > this.#max_pages) this.#visited_pages.shift()

      // to do : we may need to add pagination navigation links, 'next page' etc, to history
      //         try add to Pagination component (will carry to Browse/Search/Recent etc)

      // if no props, we register page w/ no context
      if(!props || props === 'undefined' || props.context === 'undefined') {
         this.#visited_pages.push({key:component_name})
      }
      else {
         this.#visited_pages.push(props.context)
      }

      // 'tape' head may not be at last index
      this.#head++

      console.log(this.#visited_pages) // to do : remove
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

      // to do : consider for this (and other operations) we have to update UI (render func)
   }

}


export default History