import App from '../../components/App/App.js'
import { create_section,create_h,create_p,create_div } from '../../utilities/ui_elements.js'




class WaitDialog {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      App.enable_nav(false)

      let dimmer = create_section({
         attributes:[
            {key:'id',value:'dimmer'}
         ],
         classlist:['dlg_bg']
      })

      const dlg = create_section({
         attributes:[
            {key:'id',value:'dlg_box'}
         ],
         classlist:['dlg','pb_2']
      })
      const dlg_h = create_h({
         level:'h3',
      })
      const dlg_text = create_p({
         text:`Please wait while we process the import file:`
      })
      const dlg_file_name = create_p({
         classlist:['bg_inform'],
         text:`${this.#props.file_name.substring(this.#props.file_name.lastIndexOf('\\') + 1)}`
      })

      // progress spinner
      const spinner_wrap = create_div({
         classlist:['flex','justify-center','w_full','fit_content','mx_auto']
      })
      const spinner = create_div({
         classlist:['lds-dual-ring']
      })
      spinner_wrap.append(spinner)

      // assemble
      dlg.append(dlg_h,dlg_text,dlg_file_name,spinner_wrap)
      dimmer.append(dlg)
      
      // this.set_top()
      return dimmer
   }

   set_top = () => {
      const top = `${window.scrollY}px`
      const dlg_box = document.getElementById('dlg_box')
      if(dlg_box) {
         dlg_box.style.top = top
      }
   }

   close = () => {
      setTimeout(() => this.remove(),2000)
   }

   remove = () => {
      
      App.enable_nav(true)

      const dimmer = document.getElementById('dimmer')
      if(dimmer) {
         dimmer.remove()
      }
   }

   // enable buttons/links displayed in the render
   activate = () => {

   }

}



export default WaitDialog