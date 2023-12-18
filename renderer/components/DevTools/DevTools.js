import { create_section,create_button,create_div } from '../../utilities/ui_elements.js'





class DevTools {

   render = () => {
      
      let dev_tools = create_section({
         attributes:[
            {key:'id',value:'dev_tools'}
         ]
      })

      // Create and Inject 'Add Records' Button
      let add_records_btn = create_button({
         attributes:[
            {key:'data-id',value:'add_records_btn'},
            {key:'type',value:'button'},
         ],
         text:'Add Records'
      })
      dev_tools.appendChild(add_records_btn)

      // UI Status outcomes
      let add_records_outcome = create_div({
         attributes:[
            {key:'id',value:'add_records_outcome'}
         ],
         classlist:['bg_lightgrey', 'mt_1', 'pl_1', 'pr_1']
      })
      dev_tools.appendChild(add_records_outcome)
         
      if(add_records_btn) {
         add_records_btn.addEventListener('click',async() => {
            const response = await window.dev_api_key.addTestRecords()
            if(typeof response != "undefined") {
               add_records_outcome.innerText = response
            }
            // disable button - give plenty time since this is outside our control and low cost to wait 30secs 
            // (it's a rare operation)
            add_records_btn.disabled = 'disabled'
            add_records_outcome.innerText = '\nworking..\n\n'
            setTimeout(() => this.enable_add_records_btn(),30000)

            // we overwrite notificaton if failed
            if(response.outcome) {
               if(response.outcome === 'fail') {
                  add_records_outcome.innerText = response.message
               }
            }
         })
      }
   
      return dev_tools
   }

   enable_add_records_btn = () => {

      let add_records_btn = document.getElementById('add_records_btn')
      if(add_records_btn) {      
         add_records_btn.disabled = false
      }
      
      let add_records_outcome = document.getElementById('add_records_outcome')
      if(add_records_outcome) {
         add_records_outcome.innerText = ''
      }
   }
}


export default DevTools