const { BrowserWindow } = require ("electron");


//
// client utility funcs
//
function notify_client_alert(message) {
   
   // we only ever have one main_window, and generally any notifications we send
   // will be targeted at the current window, so we can rely on this
   BrowserWindow.getFocusedWindow().webContents.send(
      'notify',
      message
   )
}

module.exports = {
   notify_client_alert
}