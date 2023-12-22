import { create_section,create_h, create_p } from '../../utilities/ui_elements.js'



class WaitDialog {

   #props

   constructor(props) {
      this.#props = props
   }

   render = () => {

      let dimmer = create_section({
         attributes:[
            {key:'id',value:'wait_dlg'}
         ],
         classlist:['dlg_bg']
      })

      const dlg = create_section({
         attributes:[
            {key:'id',value:'dlg_box'}
         ],
         classlist:['dlg']
      })

      const dlg_h = create_h({
         level:'h3',
      })
      const dlg_text = create_p({
         text:'Please wait while we process the import file.'
      })

      // assemble
      dlg.append(dlg_h,dlg_text)
      dimmer.append(dlg)
      
      // this.set_top()
      return dimmer
   }

   set_top = () => {
      const top = `${window.scrollY}px`
      console.log('top',top)
      const dlg_box = document.getElementById('dlg_box')
      if(dlg_box) {
         console.log('setting top ',top)
         dlg_box.style.top = top
      }
   }

   remove = () => {
      const dlg_bg = document.getElementById('dlg_bg')
      if(dlg_bg) {
         dlg_bg.remove()
      }
   }

   // enable buttons/links displayed in the render
   activate = () => {

   }

}



export default WaitDialog