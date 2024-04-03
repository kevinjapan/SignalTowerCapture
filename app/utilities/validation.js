const { assoc_arr_obj } = require('../utilities/utilities')


const LENS = {
   MAX_SEARCH:25
}


//
// String
//
const is_valid_string = (value,min_len = 0,max_len = 255) => {

   if((typeof value  === 'string') && (value.length >= min_len) && (value.length <= max_len)) {
      return true
   }
   else {
      throw `This value is not a valid string.`
   }
}


//
// Int
//
const is_valid_int = (value, min = 0, max = 10000) => {
   if(Number.isInteger(parseInt(value)) && (parseInt(value) >= min) && (parseInt(value) <= max))  {
      return true
   }
   else {
      throw `This value is not a valid number.`
   }
}


//
// Date
// currently we check only expected format, not if actual legit date
//
const is_valid_date = (value) => {

   // expected format : sql-format : 2023-11-22 12:42:38 (time part is optional)

   if(value == null) return false // tests for both undefined and null
   let result = true
   let curr_year =  new Date().getFullYear()
   let parts = value.split(' ')

   // validate date part
   //
   let date_parts = parts[0].split('-')
   if(date_parts.length === 3) {
      // check all are numbers - parseInt reduces to any digit in the string, so we use reg exp for accuracy
      if( (!/^\d+$/.test(date_parts[0]) ) || !(/^\d+$/.test(date_parts[1])) || !(/^\d+$/.test(date_parts[2]))) result = false
      if((parseInt(date_parts[0]) < 1700) || (parseInt(date_parts[0]) > curr_year)) result = false   
      if((parseInt(date_parts[1]) < 1) || (parseInt(date_parts[1]) > 12)) result = false  
      if((parseInt(date_parts[2]) < 1) || (parseInt(date_parts[2]) > 31)) result = false
   }
   else {
      result = false
   }

   // validate time part
   //
   if(parts.length === 2) {
      let time_parts = parts[1].split(':')
      if(time_parts.length === 3) {
         // check all are numbers
         if( (!/^\d+$/.test(time_parts[0]) ) || !(/^\d+$/.test(time_parts[1])) || !(/^\d+$/.test(time_parts[2]))) result = false
         if((parseInt(time_parts[0]) < 0) || (parseInt(time_parts[0]) > 12)) result = false   
         if((parseInt(time_parts[1]) < 0) || (parseInt(time_parts[1]) > 60)) result = false  
         if((parseInt(time_parts[2]) < 0) || (parseInt(time_parts[2]) > 60)) result = false
      }
      else {
         result = false
      }
   }

   if(result) { 
      return true
   }
   else {
      // we need to throw a message to notify user on form errors.
      throw 'This value is not a valid date.'
   }
}


//
// Collection Item
//
const is_valid_collection_item_csv = (fields_list,csv) => {

   // get 1-d arr of raw data for keys and values
   const field_keys = fields_list.map(field => field.key)
   const values = csv.split(',')
   
   if(field_keys.length !== values.length) {
      // to do : bail and notify user not matching..
   }

   // get collection_item as an assoc array
   const collection_item = assoc_arr_obj(field_keys,values)

   const is_valid_record_obj =  is_valid_collection_item(fields_list,collection_item)

   // for csv notifications, we want to show the value of any field failing
   // is_valid_collection_item() does not provide this - it's primarily for form validation
   // and hence not required as the value is retained in the UI input field

   if(is_valid_record_obj.outcome === 'fail') {
      // we simply pass is_valid_record_obj but inject additional error info. - failing value - if 'fail'
      let temp_errors = is_valid_record_obj.errors.map((err) => {
         err.value = collection_item[err.name]
         return err
      })
      is_valid_record_obj.errors = temp_errors
   }

   return is_valid_record_obj
}

const is_valid_collection_item = (fields_list,collection_item) => {

   let errors = []
   let is_valid = true

   // for each key, validate the submitted value against blueprint 'tests'
   let ci_array = Object.keys(collection_item)

   ci_array.forEach((key) => {

      // extract 'test' from the blueprint for this key
      let blueprint = fields_list.filter((col) => {
         return col.key === key
      })

      if(key === 'file_name') {
         if(!is_valid_file_name(collection_item[key])) {
            errors.push({name:key,message:'This is not a valid filename.'})
            is_valid = false
         }
      }

      if(typeof blueprint[0] !== 'undefined') 
      {
        let test = blueprint[0].test

         switch(test.type) {
            case 'string':
               try {
                  is_valid_string(collection_item[key],test.min,test.max)                 
               }
               catch(e) {
                  errors.push({name:key,message:e})
                  is_valid = false
               }
               break
            case 'int':
               try {
                  is_valid_int(collection_item[key],test.min,test.max)
               }
               catch(e) {
                  errors.push({name:key,message:e})
                  is_valid = false
               }
               break
            case 'date':
               try {
                  // some date fields are functionally null (deleted_at)
                  if(collection_item[key] === 'null') {
                     if(blueprint[0].data_type.indexOf('NOT NULL') >= 0) {
                        throw 'This value is not a valid date.' 
                     }
                     else {
                        // do nothing
                     }
                  }
                  else {
                     is_valid_date(collection_item[key])
                  }
               }
               catch(e) {
                  errors.push({name:key,message:e})
                  is_valid = false
               }
               break
            default:
         }
      }

   })

   if(is_valid) {
      return {
         outcome:'success'
      }
   }
   else {
      return {
         outcome:'fail',
         errors:errors
      }
   }
}


//
// Search
//
const is_valid_search = (search_obj) => {
   if(is_valid_search_term(search_obj.search_term)) {
      return true
   }
   return false
}

//
// Search Term
//
const is_valid_search_term = (search_term) => {
   if( (typeof search_term  === 'string') && (search_term.length > 0) && (search_term.length <= LENS.MAX_SEARCH) ) {
      return true
   }
   return false
}


// 
// Filename
// generally filenames should be added through OS file dialog,
// but we do require user can manually update/enter if required.
//
const is_valid_file_name = (file_name) => {
   let parts = file_name.split('.')
   if(parts.length !== 2) return false
   
   if(parts[1].length < 3 || parts[1].length > 4) return false
   return !/[^a-z0-9_ .@()-]/i.test(file_name)
}


//
// AppConfig Record
// AppConfig may not include all valid fields
// we should check those present are permitted and valid
//
const is_valid_app_config_record = (fields_list,app_config_record) => {
   
   let errors = []
   let is_valid = true
   
   // for each rcvd key, validate the submitted value against blueprint 'tests'
   let rcvd_form_keys = Object.keys(app_config_record)
   
   rcvd_form_keys.forEach((key) => {

      // extract 'test' from the blueprint for this key
      let blueprint = fields_list.filter((col) => {
         return col.key === key
      })
      
      if(typeof blueprint[0] !== 'undefined') 
      {
         let test = blueprint[0].test

         switch(test.type) {
            case 'string':
               try {
                  is_valid_string(app_config_record[key],test.min,test.max)                 
               }
               catch(e) {
                  errors.push({name:key,message:e})
                  is_valid = false
               }
               break
            case 'int':
               try {
                  is_valid_int(app_config_record[key],test.min,test.max)
               }
               catch(e) {
                  errors.push({name:key,message:e})
                  is_valid = false
               }
               break
            case 'date':
               try {
                  is_valid_date(app_config_record[key])
               }
               catch(e) {
                  errors.push({name:key,message:e})
                  is_valid = false
               }
               break
            default:
         }
      }
   })

   if(is_valid) {
      return {
         outcome:'success'
      }
   }
   else {
      return {
         outcome:'fail',
         errors:errors
      }
   }
}


module.exports = {
   LENS,
   is_valid_collection_item_csv,
   is_valid_collection_item,
   is_valid_int,
   is_valid_string,
   is_valid_date,
   is_valid_search,
   is_valid_app_config_record
}