const { ipcMain,shell,dialog } = require('electron')
const path = require('node:path')
const { notify_client_alert } = require('../app/utilities/client_utilities')


//
// Our exposed API
//
ipcMain.handle('files:openFolderDlg',open_folder_dlg)
ipcMain.handle('files:getFolderFilesList',get_folder_files_list)
ipcMain.handle('files:fileExists',file_exists)
ipcMain.handle('files:getFolderPath',get_folder_path)
ipcMain.handle('files:getFilePath',get_file_path)
ipcMain.handle('files:openFolder',open_folder)
ipcMain.handle('files:filePathSep',file_path_sep)
ipcMain.handle('files:saveFile',save_file)
ipcMain.handle('files:getFileSize',get_file_size)


async function file_exists(event,file_path) {
   
   const fs = require('fs')
   try {
      await fs.promises.access(file_path.trim())
      return {
         outcome:'success'
      }
   }
   catch(error) {
      return {
         outcome:'fail'
      }
   }
}

async function get_folder_path () {
   const fs = require('fs')
   const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
   if(!canceled) {
      return filePaths
   }
}

async function save_file (event,options) {

   const fs = require('fs')
   const  { canceled, filePath  } = await dialog.showSaveDialog(options)
   if(!canceled) {
      return {
         outcome:'success',
         file_path:filePath 
      }
   }
   return {
      outcome:'fail',
      message:''     // we don't notify canceled
   }
}

async function get_file_size (event,file_path) {

   const fs = require('fs')
   try {
      var stats = fs.statSync(file_path)
      var file_bytes_size = stats.size      
      return {
         outcome:'success',
         file_kb_size:Math.ceil(file_bytes_size / 1024)   // calc size in MB = file_bytes_size / (1024*1024)
      }
   }
   catch(error) {
      return {
         outcome:'fail'
      }
   }
}

async function get_file_path (event,options) {
   
   const fs = require('fs')
   const { canceled, filePaths } = await dialog.showOpenDialog(options)
   if(!canceled) {
      return {
         outcome:'success',
         files:filePaths
      }
   }
   return {
      outcome:'fail',
      message:''
   }
}

async function open_folder (event,full_folder_path) {
   const fs = require('fs')
   if (fs.existsSync(full_folder_path)) {
      shell.openPath(path.resolve(full_folder_path))
   }
   else {
      notify_client_alert(
         `The folder could not be found. 
         \n${full_folder_path}
         \nPlease check that the Folder Path in the record is correct and that the folder exists.`)
   }
}

// return OS file segement separator
async function file_path_sep () {
   return path.sep
}

async function open_folder_dlg (event) {

   const fs = require('fs')
   const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })

   if(!canceled) {

      // future : try/catch as get_folder_files_list() below : rollout
      
      // get array of filenames from folder
      let filenames = fs.readdirSync(filePaths[0])
      let file_objects_list = []
      let count = 0

      filenames.forEach(file => {
         let file_object = {}
         if (fs.statSync(filePaths[0] + '/' + file).isDirectory()) {
            file_object['type'] = 'dir'
            file_object['filename'] = file
            file_object['path'] = filePaths[0]
         } 
         else {
            file_object['type'] = 'file'
            file_object['filename'] = file
            file_object['path'] = filePaths[0]
         }
         file_objects_list[count] = file_object
         count++
      })

      // we return folder_obj (files_list may be empty)
      return {
         folder_name:filePaths,
         files_list:file_objects_list
      }
   }
}

async function get_folder_files_list (event,folder_path) {

   const fs = require('fs')
   let file_objects_list = []
   let count = 0

   try {
      const files = fs.readdirSync(folder_path)
      files.forEach(file => {
         let file_object = {}
         if (fs.statSync(folder_path + '/' + file).isDirectory()) {
            file_object['type'] = 'dir'
            file_object['filename'] = file
            file_object['path'] = folder_path
         }
         else {
            file_object['type'] = 'file'
            file_object['filename'] = file
            file_object['path'] = folder_path
         }
         file_objects_list[count] = file_object
         count++
      })
      return {
         folder_name:folder_path,
         files_list:file_objects_list
      }
   }
   catch(error) {
      // future : alerts are ugly - custom version?
      notify_client_alert('Sorry, we could not open the folder you selected.' + error)
      return null
   }
}


//
// enable database injection
//
module.exports = function(database) {
   
}
