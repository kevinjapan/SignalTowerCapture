const { assoc_arr_obj } = require('../utilities/utilities')
const { split_csv_ignore_quoted } = require('../utilities/strings')


const LENS = {
   MAX_SEARCH:25
}


//
// String
//
const is_valid_string = (value,min_len = 0,max_len = 255) => {
   if((typeof value  === 'string') && (value.length >= min_len) && (value.length <= max_len)) {   
      if(has_invalid_chars(value)) 
         {throw `This value is not a valid string, it may contain special characters not permitted in this field [eg " ]`
      }
      return true
   }
   else {
      throw `This value is not a valid string.`
   }
}


//
// Special chars we don't permit in CollectionItem string fields
//
const has_invalid_chars = (str) => {
   return /"/.test(str)
}


//
// Int
// future : max int needed?
const is_valid_int = (value, min = 0, max = 999999999) => {
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
   if(value === '') return true // we permit empty strings (DB will check NOT NULL and invalidate if required)
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
         if((parseInt(time_parts[0]) < 0) || (parseInt(time_parts[0]) > 23)) result = false   
         if((parseInt(time_parts[1]) < 0) || (parseInt(time_parts[1]) > 59)) result = false  
         if((parseInt(time_parts[2]) < 0) || (parseInt(time_parts[2]) > 59)) result = false
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
      throw 'This value is not a valid date (YYYY-MM-DD)'
   }
}


//
// Collection Item
//

//
// is_valid_collection_item_csv
// Does the CSV given match the expected CollectionItem fields exactly
//
const is_valid_collection_item_csv = (fields_list,csv) => {

   if(!Array.isArray(fields_list)) {
      return {
         outcome:'fail',
         errors:[
            {name:'',message:'There was an error determining the required CSV fields.',value:''}
         ]
      }
   }
   if(typeof csv !== 'string' || csv.length === 0) {
      return {
         outcome:'fail',
         errors:[{name:'',message:'A line was read that contained an invalid string or was empty.',value:''}]
      }
   }

   // get 1-d arr of raw data for keys and values
   const field_keys = fields_list.map(field => field.key)
   const values = split_csv_ignore_quoted(csv)
   
   if(field_keys.length !== values.length) {
      return {
         outcome:'fail',
         errors:[
            {message:'The number of tokens on the CSV line does not match the expected number.',},
            {message:`We expected ${field_keys.length} tokens on each line, but the read line contains ${values.length}.`,}
         ]
      }
   }

   // get collection_item as an assoc array
   const collection_item = assoc_arr_obj(field_keys,values)

   // CSV may contain some missing data which we can default to:
   if(collection_item['file_type'] === '') collection_item['file_type'] = 'FILE'

   const is_valid_record_obj =  is_valid_collection_item(fields_list,collection_item)

   // for csv notifications, we want to show the value of any field failing
   // is_valid_collection_item() does not provide this - it's primarily for form validation
   // and hence not required as the value is retained in the UI input field

   if(is_valid_record_obj.outcome === 'fail') {
      // we simply pass is_valid_record_obj but inject additional error info. - failing value - if 'fail's
      let temp_errors = []
      if(Array.isArray(is_valid_record_obj.errors)) {
         temp_errors = is_valid_record_obj.errors.map((err) => {
            err.value = collection_item[err.name]
            return err
         })
      }
      is_valid_record_obj.errors = temp_errors
   }

   return is_valid_record_obj
}


//
// is_valid_collection_item
//
const is_valid_collection_item = (fields_list,collection_item) => {

   let errors = []
   let is_valid = true

   // for each key, validate the submitted value against blueprint 'tests'
   let ci_array = Object.keys(collection_item)
   ci_array.forEach((key) => {

      // extract 'test' from the blueprint for this key
      // - we extract field here and access 'test' property below
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
                        throw 'This value is not a valid date (YYYY-MM-DD)' 
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
// filenames are added through O/S file dialog
// Allow for legacy chars in current dataset files (- , _ , ~ , & , + )
//
const is_valid_file_name = (file_name) => {
   
   // we split on last '.', since legacy file_names may contain multiple '.' chars
   let name_part = file_name.substring(0,file_name.lastIndexOf('.'))
   let ext_part = file_name.substring(file_name.lastIndexOf('.') + 1)

   // are component parts correct
   if(name_part === '' || ext_part === '') return false

   // we have to be flexible here since legacy files may have unknown exts.
   if(ext_part.length < 2 || ext_part.length > 6) return false

   // are all chars valid
   return !/[^a-z0-9\'-_~&+ .@()-]/i.test(file_name)
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