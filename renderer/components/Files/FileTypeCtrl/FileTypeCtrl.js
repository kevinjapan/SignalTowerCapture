import { app } from '../../../renderer.js'
import Notification from '../../../components/Notification/Notification.js'
import { create_section, create_div, create_button } from '../../../utilities/ui_elements.js'
import FileTypeCheckBox from '../../Forms/Forms/FileTypeCheckbox/FileTypeCheckbox.js'
import { is_valid_response_obj } from '../../../utilities/ui_response.js'
import {title_from_file_name, is_excluded_folder } from '../../../utilities/ui_utilities.js'
import DisplayImgOrIcon from '../../Utilities/DisplayImgOrIcon/DisplayImgOrIcon.js'




class FileTypeCtrl {

   // we check targeted files are in valid location
   static #root_folder

   // the record item
   static #item

   // 'add' or 'update' record
   static #action


   static render = async(action,root_folder,item,field,curr_field_value) => {

      FileTypeCtrl.#root_folder = root_folder
      FileTypeCtrl.#item = item
      FileTypeCtrl.#action = action

      const container = create_section()

      container.append(create_div(),FileTypeCheckBox.render(field.key,curr_field_value))

      // future : review : orig used in parent Component where we had this props - necessary?
      // if(this.#props.find_files) {

         // btn to select file for 'file_name' field
         let find_file_btn = create_button({
            attributes:[{key:'id',value:'find_file_btn'}],
            classlist:['form_btn','mb_2'],
            text:'Find File'
         })
         container.append(find_file_btn)

      // }
      console.log('constructor finishing up')
      return container
   }  
  
   static activate = (enable_submit,disable_submit) => {
      
      // On 'Find File' select w/ dialog
      const find_file_btn = document.getElementById('find_file_btn')
      if(find_file_btn) {

         find_file_btn.addEventListener('click',async(event) => {   
            
            event.preventDefault()
            
            const sep = await window.files_api.filePathSep()            
            const result = await window.files_api.getFilePath()
      
            if(result.outcome === 'success') {
               // inject appropriate into file_name and folder_path inputs
               let full_path = result.files[0]
               let separator = full_path.lastIndexOf(sep)
               let path = full_path.substring(0,separator)
               let file = full_path.substring(separator + 1)
               let file_name_input = document.getElementById('file_name')
               if(file_name_input) file_name_input.value = file
               
               let folder_path = document.getElementById('folder_path')
               if(folder_path) {

                  const is_excluded = await is_excluded_folder(path)
                  
                  // verify file is within root_folder and not in Settings.exluded_folders
                  if(path.indexOf(FileTypeCtrl.#root_folder) === 0 && !is_excluded) {                        
                     folder_path.value = path.replace(FileTypeCtrl.#root_folder,'') // relative path
                  }
                  else {
                     disable_submit()
                     // future : find_file_outcome is defined in FileTypeCheckbox - should be in this class? rollout this file
                     Notification.notify(
                        '#find_file_outcome',
                        `Invalid location - the selected folder is not within the Collections Folders or is an excluded sub-folder.`,
                        [],
                        false)
                     return
                  }
               }

               // display if new file is an img file
               let file_path = `${path}\\${file}`
               await DisplayImgOrIcon.render(img_col,file_path,FileTypeCtrl.#item ? FileTypeCtrl.#item['img_desc'] : 'image')

               // Is there an existing record for the selected file?
               let context = {
                  page:1,
                  field_filters:[
                     {field:'file_name',value:file},
                     {field:'folder_path',value:path.replace(FileTypeCtrl.#root_folder,'')}]
               }

               try {                
                  const collection_items_obj = await window.collection_items_api.getItems(context)
                  
                  if (typeof collection_items_obj != "undefined" && collection_items_obj.outcome === 'success') {                        
                     if(await is_valid_response_obj('read_collection_items',collection_items_obj)) {

                        if(collection_items_obj.collection_items.length < 1) {
                           // There is no record for this file
                           enable_submit()
                           Notification.notify('#find_file_outcome',`This file is valid.`,['bg_inform'],false)

                           // Auto-gen candidate title from the file name if non-exists
                           // we always overwrite based on file_name - priority is convenience
                           let title = document.getElementById('title')
                           if(title && title.value === '') title.value = title_from_file_name(file_name_input.value)
                        }
                        else {
                           // There is an existing record for this file
                           if(FileTypeCtrl.#action === 'update') {
                              // Is existing record the same record we are currently editing
                              const existing_record_id = collection_items_obj.collection_items[0].id
                              const current_record_id = FileTypeCtrl.#item.id
                              if(parseInt(existing_record_id) === parseInt(current_record_id)) {
                                 // same record, we are changing file to a valid alternative (no existing record for new file)
                                 enable_submit()
                                 Notification.notify('#find_file_outcome',`This file is valid.`,['bg_inform'],false)
                              }
                              else {
                                 // match is for a record other than the one we are editing
                                 disable_submit()
                                 Notification.notify('#find_file_outcome',`Invalid file - there is already a record for this file.`,[],false)
                              }
                           }
                           else {
                              disable_submit()
                              Notification.notify('#find_file_outcome',`Invalid file - there is already a record for this file.`,[],false)
                           }
                        }
                     }
                     else {
                        app.switch_to_component('Error',{
                           msg:'Sorry, we were unable to process an invalid response from the main process in CollectionItemForm.'
                        },false)
                     }
                  }
                  else {
                     throw 'No records were returned.' + collection_items_obj.message ? collection_items_obj.message : ''
                  }
               }
               catch(error) {
                  app.switch_to_component('Error',{
                     msg:'Sorry, we were unable to access the Records.',
                     error:error
                  },false)
               }
            }
            else {
               Notification.notify('#find_file_outcome',result.message)
            }
         })
      }
   }
}

export default FileTypeCtrl