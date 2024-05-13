

// we employ a simple flash message for all status msgs and errors
// critical issues would be better as fixed notes

class AppStatus {

   static notify = (msg) => {
      const app_status_elem = document.getElementById('app_status')
      if(app_status_elem) {

         app_status_elem.classList.add('app_status_active')
         app_status_elem.textContent = msg

         setTimeout(() => {
            app_status_elem.classList.remove('app_status_active')
         },3000)

         AppStatus.activate(app_status_elem)
      }
   }

   static activate = (elem) => {
      elem.addEventListener('click',(event) => {
         elem.classList.remove('app_status_active')
      })
   }
}

export default AppStatus
