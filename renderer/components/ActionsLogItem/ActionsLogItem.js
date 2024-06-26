import { create_div } from '../../utilities/ui_elements.js'
import { get_ui_ready_date,get_ui_ready_time } from '../../utilities/ui_datetime.js'



class ActionsLogComponent {


   render = (action) => {

      const actions_log_item = create_div({
         attributes:[
            {key:'id',value:'actions_log_item'}
         ],
         classlist:['actions_log_item','p_0.5','border','border_radius_0.5','mt_1']
      })
   
      const item_row = create_div({
         classlist:['flex','gap_1']
      })
      const file_elem = create_div({
         classlist:['text_grey'],
         text:action.file
      })
      const created_date_elem = create_div({
         classlist:['text_grey'],
         text:get_ui_ready_date(action.created_at,true),
         classlist:['text_bold']
      })
      const created_time_elem = create_div({
         classlist:['text_grey'],
         text:' @ ' + get_ui_ready_time(action.created_at)
      })
      
      // assemble
      item_row.append(file_elem,created_date_elem,created_time_elem)
      actions_log_item.append(item_row)

      return actions_log_item
   }



   // enable buttons/links displayed in the render
   activate = async () => {

   }




}

export default ActionsLogComponent