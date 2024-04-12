import App from '../App/App.js'
import WaitDialog from '../WaitDialog/WaitDialog.js'
import Notification from '../../components/Notification/Notification.js'
import ActionsLogItem from '../../components/ActionsLogItem/ActionsLogItem.js'
import { get_ui_ready_date,get_ui_ready_time,get_sqlready_datetime } from '../../utilities/ui_datetime.js'
import { create_h,create_p,create_div,create_section,create_button } from '../../utilities/ui_elements.js'


//
// We use classes to activate elements since a page may contain multiple ActionsLogComponents
//

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

   render = (action) => {

      this.#context.filters.action = action

      const actions_log_component = create_section({
         attributes:[
            {key:'id',value:`actions_log_component_${this.#key}`}
         ],
         classlist:['actions_log_component','ui_component','border','fit_content_height']
      })
   
      const heading = create_h({
         attributes:[
            {key:'id',value:`actions_log_heading_${this.#key}`}
         ],
         level:'h5',
         classlist:['text_grey','cursor_pointer'],
         text:this.#label
      })

      // to do : how do we differentiate outcomes btwn multiple ActionsLogComponents on same page?
      //         some dynamic part to 'id' here? as we did w/ top and bottom key in PaginationNav.
      const actions_log_outcome = create_div({
         attributes:[
            {key:'id',value:`actions_log_outcome_${this.#key}`}
         ]
      })

      
      this.#results_container = create_div({
         attributes:[
            {key:'id',value:`results_container_${this.#key}`}
         ],
         classlist:['display_none','pt_1']
      })
      
      this.#results_container.append(this.get_items())


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
      
         if(typeof actions_log_obj != "undefined") {
      
            if(actions_log_obj.outcome === 'success') {
               
               this.#results_container.replaceChildren()

               if(actions_log_obj.actions.length > 0) {
         
                  const actions_log_item = new ActionsLogItem() 
                  actions_log_obj.actions.forEach((item) => {        
                     this.#results_container.appendChild(actions_log_item.render(item))
                  })
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
         App.switch_to_component('Error',props)
      }

   }


   // enable buttons/links displayed in the render
   activate = async () => {

      //
      // toggle view history list
      //
      const log = document.querySelector(`#actions_log_heading_${this.#key}`)
      if(log) {
         log.addEventListener('click',(event) => {

            console.log(`clicked log actions_log_heading_${this.#key}`)
            const target = document.getElementById(`results_container_${this.#key}`)
            if(target) {
               target.classList.toggle('display_none')
            }

         })
      }


   }




}

export default ActionsLogComponent