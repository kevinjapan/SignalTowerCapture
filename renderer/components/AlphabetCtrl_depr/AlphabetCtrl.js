import { create_section,create_button } from '../../utilities/ui_elements.js'




class AlphabetCtrl {

   #props

   #alphabet = [...Array(26).keys()].map((n) => String.fromCharCode(65 + n));


   constructor(props) {
      this.#props = props
   }

   render = () => {

      const alpha_ctrl = create_section({
         classlist:['flex','justify_center','gap_0.15','pt_2','mr_auto','w_full','p_0']
      })

      const reset_btn = create_button({
         attributes:[
            {key:'id',value:'reset_btn'}
         ],
         classlist:[
            'alpha_btn','form_btn','border','h_2','m_0','p_0.25','pt_0','pb_0','cursor_pointer',this.#props.selected_char == null ? 'bg_positive' : ''
         ],
         text:'All'
      })

      this.#alphabet.forEach(char => {
         alpha_ctrl.append(
            create_button({
               attributes:[
                  {key:'char',value:char}
               ],
               classlist:[
                  'form_btn','alpha_btn','alpha_char_btn','h_2','m_0','p_0.25','pl_0.5','pr_0.5','pt_0','pb_0','cursor_pointer',this.#props.selected_char === char ? 'bg_positive' : ''
               ],
               text:char
            })
         )
      })
      alpha_ctrl.prepend(reset_btn)

      return alpha_ctrl
   }

   // enable buttons/links displayed in the render
   activate = () => {

      //
      // select alpha char btns
      //
      let alpha_char_btns = document.querySelectorAll('.alpha_char_btn')
      if(alpha_char_btns){

         alpha_char_btns.forEach(alpha_char_btn => {

            alpha_char_btn.addEventListener('click',(event) => {

               // clear all
               document.querySelectorAll('.alpha_btn').forEach(btn => {
                  btn.classList.remove('bg_positive')
               })

               // highlight selected
               this.#props.submit_alpha_filter(event.target.getAttribute('char'))
               alpha_char_btn.classList.add('bg_positive')
            })
         })
      }

      //
      // reset btn
      //
      let reset_btn = document.getElementById('reset_btn')
      if(reset_btn) {
         reset_btn.addEventListener('click',this.reset_alpha_filter)
      }

   }
   reset_alpha_filter = (event) => {
      // clear all
      document.querySelectorAll('.alpha_btn').forEach(btn => {
         btn.classList.remove('bg_positive')
      })
      this.#props.reset_alpha_filter()
   }

}


export default AlphabetCtrl