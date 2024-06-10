import { icon } from '../../utilities/ui_utilities.js'
import { create_div } from '../../utilities/ui_elements.js'



// to do : once this is working correctly (and we can step 'back' from Record to correct paginated list state)
//         - then we can remove 'back' btn from all components themselves.


class History {

   // we store 'context' list for visited pages
   #visited_pages = []

   // 'tape' head tracks index position on #visited_pages
   #head = -1

   // avoid proliferation, capture most use cases
   #max_pages = 20

   // app API to switch component page
   #switch_to_component


   constructor(switch_component_callback) {
      this.#switch_to_component = switch_component_callback
   }

   render = () => {

      const history_component = create_div({
         attributes:[{key:'id',value:'history_component'}],
         classlist:['flex','align_items_center','text_white','no_wrap']
      })
      
      const back_btn = icon('history_back',[{key:'id',value:'back_btn'}],['cursor_pointer','disabled_icon'])

      // const clear_btn = create_button({
      //    attributes:[{key:'id',value:'clear_btn'}],
      //    classlist:[],
      //    text:'clr'
      // })

      const forward_btn = icon('history_forward',[{key:'id',value:'forward_btn'}],['cursor_pointer','disabled_icon'])

      history_component.append(back_btn,forward_btn)
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

   set_head = (new_index) => {
      this.#head = new_index 
   }

   back = () => {
      if(this.#head <= 0) return false
      this.set_head(this.#head - 1)

      if(this.#head === 0) this.toggle_btn('back_btn',false)
      if(this.#head < this.#visited_pages.length - 1) this.toggle_btn('forward_btn',true)

      const page = this.#visited_pages[this.#head]

      if(page && page.key) this.#switch_to_component(page.key,page ? {context:page} : '',false)
   }

   forward = () => {
      if(this.#head >= this.#visited_pages.length - 1) return false
      this.set_head(this.#head + 1)

      if(this.#head > 0) this.toggle_btn('back_btn',true)
      if(this.#head === this.#visited_pages.length - 1) this.toggle_btn('forward_btn',false)

      const page = this.#visited_pages[this.#head]
      if(page && page.key) this.#switch_to_component(page.key,page ? {context:page} : '',false)
   }

   toggle_btn = (btn_id,enabled) => {
      const btn = document.getElementById(btn_id)
      if(btn) enabled ? btn.classList.remove('disabled_icon') : btn.classList.add('disabled_icon')
   }

   add_visited_page = (component_name,props) => {

      if(component_name === '') return false

      // to do : don't add if same page clicked - disable click on nav? (but native navigation?)
      // to do : exclude pagination links from History - ensure they are not adding

      // move head
      this.#head < this.#max_pages - 1 ? this.set_head(this.#head + 1) : this.set_head(this.#max_pages - 1)

      // we trim history before adding
      // if a opened a new page while traversing history, discard history after the head
      if(this.#head < this.#visited_pages.length) {
         this.#visited_pages.splice(this.#head)
      }
      else {
         // else, discard first page if max_pages reached
         if(this.#visited_pages.length > this.#max_pages - 1) this.#visited_pages.shift()
      }

      // add page
      if(!props || props === 'undefined') {
         this.#visited_pages.push({key:component_name})
      }
      else {
         this.#visited_pages.push(props)
      }

      // update ctrls // to do : do we want to farm out to separate 'state' method called by each client method in this class
      this.#head === 0 ? this.toggle_btn('back_btn',false) :  this.toggle_btn('back_btn',true)
      this.#head < this.#visited_pages.length - 1 ? this.toggle_btn('forward_btn',true) : this.toggle_btn('forward_btn',false)

      // history node index
      return this.#head
   }

   //
   // Current page can add or change context properties in the history node
   //
   augment_current_context = (augment_context) => {

      let keys = Object.keys(augment_context)
      if(keys) {
         let current_context = this.#visited_pages[this.#head]
         keys.forEach(key => {
            current_context[key] = augment_context[key]
         })
      }
   }

   clear = () => {
      this.#visited_pages = []
      this.set_head(-1)
   }

}


export default History