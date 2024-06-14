import { app } from '../../renderer.js'
import ActionsLogItem from '../../components/ActionsLogItem/ActionsLogItem.js'
import { create_h,create_div,create_section } from '../../utilities/ui_elements.js'



class ActionsLogComponent {

   // the key allows us to distinguish btwn multiple ActionsLogComponent on same view
   #key

   #label

   #context = {
      filters:{
         action:''
      }
   }

   #results_container

   constructor(key,label) {
      this.#key = key
      this.#label = label
   }

   render = async(action) => {

      this.#context.filters.action = action

      const actions_log_component = create_section({
         attributes:[{key:'id',value:`actions_log_component_${this.#key}`}],
         classlist:['actions_log_component','ui_component','border','fit_content_height','bg_white']
      })
   
      const heading = create_h({
         attributes:[
            {key:'id',value:`actions_log_heading_${this.#key}`}
         ],
         level:'h5',
         classlist:['text_grey','cursor_pointer'],
         text:this.#label
      })

      const actions_log_outcome = create_div({
         attributes:[
            {key:'id',value:`actions_log_outcome_${this.#key}`}
         ]
      })

      this.#results_container = create_div({
         attributes:[
            {key:'id',value:`results_container_${this.#key}`}
         ],
         classlist:['display_none','pt_1'],
         text:''
      })

      if(this.#context) {
         this.get_items()
      }

      // assemble
      actions_log_component.append(heading,actions_log_outcome,this.#results_container)
   
      return actions_log_component
   }

   
   //
   // retrieve the actions_log records
   // 
   get_items = async () => {

      try {
    
         const actions_log_obj = await window.actions_api.getActionsLog(this.#context)
      
         if(typeof actions_log_obj !== 'undefined') {
      
            if(actions_log_obj.outcome === 'success') {
               if(actions_log_obj.actions.length > 0) {         
                  const actions_log_item = new ActionsLogItem() 
                  if(Array.isArray(actions_log_obj.actions)) {
                     actions_log_obj.actions.forEach((item) => {        
                        this.#results_container.appendChild(actions_log_item.render(item))
                     })
                  }
                  setTimeout(() => actions_log_item.activate(),200)
               }
               else {
                  this.#results_container.innerText = 'No records were found. '
               }
               
            }
            else {
               throw 'No records were returned. ' + actions_log_obj.message
            }
         }
         else {
            throw 'No records were returned. 2'
         }
      }
      catch(error) {
         let props = {
            msg:'Sorry, we were unable to access the Records.',
            error:error
         }
         app.switch_to_component('Error',props,false)
      }

   }


   // enable buttons/links displayed in the render
   activate = async () => {

      // toggle view history list
      const log = document.querySelector(`#actions_log_heading_${this.#key}`)
      if(log) {
         log.addEventListener('click',(event) => {
            const target = document.getElementById(`results_container_${this.#key}`)
            if(target) {
               target.classList.toggle('display_none')
            }

         })
      }


   }
   
   extend_list = () => {
      const target = document.getElementById(`results_container_${this.#key}`)
      if(target) {
         target.classList.remove('display_none')
      }
   }



}

export default ActionsLogComponent