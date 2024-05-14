// Expose APIs in the 'window' global here - accessible in the renderer process as window.xxx.
// We use 'contextBridge' module to safely expose Node APIs to renderer.

const { contextBridge, ipcRenderer } = require('electron')


// There are four  fundamental IPC patterns :

// Pattern 1: Renderer to main (one-way)
// To send messages to the listener in main.js, use the ipcRenderer.send API.
// We don't directly expose the whole ipcRenderer.send API for security reasons. 
// Make sure to limit the renderer's access to Electron APIs as much as possible.

contextBridge.exposeInMainWorld('electronAPI', {
   setTitle: (title) => ipcRenderer.send('set-title', title)
})


// Pattern 2: Renderer to main (two-way)
// Two-way IPC calling a main process module from your renderer and waiting for a result. 
// Using ipcRenderer.invoke paired with ipcMain.handle.
// 'api-key' is accessible via 'window.', 'api' is your api in main process.

contextBridge.exposeInMainWorld('app_api', {
   maxSearchTermLen: () => ipcRenderer.invoke('app:maxSearchTermLen'),
   maxTagsCount: () => ipcRenderer.invoke('app:maxTagsCount'),
   getResponseObjectKeys: (query_key) => ipcRenderer.invoke('app:getResponseObjectKeys',query_key)
})

contextBridge.exposeInMainWorld('collection_items_api', {
   getItems: (context) => ipcRenderer.invoke('items:getItems',context),
   getCollectionItemFields: () => ipcRenderer.invoke('items:getCollectionItemFields'),
   getCollectionItem: (id) => ipcRenderer.invoke('items:getCollectionItem',id),
   addCollectionItem: (collection_item) => ipcRenderer.invoke('items:addCollectionItem',collection_item),   
   updateCollectionItem: (collection_item) => ipcRenderer.invoke('items:updateCollectionItem',collection_item),
   deleteCollectionItem: (id) => ipcRenderer.invoke('items:deleteCollectionItem',id),
   restoreCollectionItem: (id) => ipcRenderer.invoke('items:restoreCollectionItem',id),
   searchCollectionItems: (search_term) => ipcRenderer.invoke('items:searchCollectionItems',search_term)
})

contextBridge.exposeInMainWorld('tags_api', {
   getTags: (context) => ipcRenderer.invoke('tags:getTags',context),
   getTagFields: () => ipcRenderer.invoke('tags:getTagFields'),
   getTag: (id) => ipcRenderer.invoke('tags:getTag',id),
   addTag: (tag) => ipcRenderer.invoke('tags:addTag',tag),   
   updateTag: (tag) => ipcRenderer.invoke('tags:updateTag',tag),
   deleteTag: (id) => ipcRenderer.invoke('tags:deleteTag',id),
})

contextBridge.exposeInMainWorld('config_api', {
   getAppConfig: () => ipcRenderer.invoke('config:getAppConfig'),
   getAppConfigFields: () => ipcRenderer.invoke('config:getAppConfigFields'),
   updateAppConfig: (app_config) => ipcRenderer.invoke('config:updateAppConfig',app_config),
   setRootFolderPath: (app_config) => ipcRenderer.invoke('config:setRootFolderPath',app_config)
})

contextBridge.exposeInMainWorld('actions_api', {
   backupDatabase: (file_name,file_path) => ipcRenderer.invoke('actions:backupDatabase',file_name,file_path),
   exportCSVFile: (file_name,folder_path) => ipcRenderer.invoke('actions:exportCSVFile',file_name,folder_path),
   exportJSONFile: (file_name,folder_path) => ipcRenderer.invoke('actions:exportJSONFile',file_name,folder_path),
   importJSONFile: (file_path) => ipcRenderer.invoke('actions:importJSONFile',file_path),
   importCSVFile: (file_path) => ipcRenderer.invoke('actions:importCSVFile',file_path),
   getActionsLog: (action) => ipcRenderer.invoke('actions:getActionsLog',action)
})

contextBridge.exposeInMainWorld('files_api', {
   fileExists: (file_path) => ipcRenderer.invoke('files:fileExists',file_path),
   getFolderPath: () => ipcRenderer.invoke('files:getFolderPath'),
   getFilePath: (filters) => ipcRenderer.invoke('files:getFilePath',filters),
   openFolderDlg: () => ipcRenderer.invoke('files:openFolderDlg'),
   getFolderFilesList: (folder_path) => ipcRenderer.invoke('files:getFolderFilesList',folder_path),
   openFolder: (folder_path) => ipcRenderer.invoke('files:openFolder',folder_path),
   filePathSep: () => ipcRenderer.invoke('files:filePathSep'),
   openSaveFileDlg: (filters) => ipcRenderer.invoke('files:openSaveFileDlg',filters),
   getFileSize: (file_path) => ipcRenderer.invoke('files:getFileSize',file_path)
})

contextBridge.exposeInMainWorld('dev_api_key', {
   addTestRecords: () => ipcRenderer.invoke('dev:addTestRecords')
})


// Pattern 3: Main to renderer
// Specify which renderer is receiving the message. 

contextBridge.exposeInMainWorld('notify_api',{
   onNotification: (callback) => ipcRenderer.on('notify',callback)
})
contextBridge.exposeInMainWorld('component_api',{
   onSwitchComponent: (callback) => ipcRenderer.on('switch_component',callback)
})


// Pattern 4: Renderer to renderer
// not required for our project.

