
// fields included in generic search queries
const SEARCH_FIELDS = 'title || content_desc || tags'

// fields included in Full Text Search are defined in 
// CollectionItemFTS.#full_fields_list

// min permitted length of user input search term
const MIN_SEARCH_TERM_LEN = 3



//
// Filters
// we always translate condition filters into our own sql 
// - even simple cases - we never user client input directly.
//   ensures we both whitelist and avoid 'user' input.
//

const is_permitted_table = (table_name) => {
   const tables_whitelist = ['collection_items','tags']
   return tables_whitelist.some(table => table_name === table)
}

//
// CollectionItem record 'status' is either active or soft-deleted and marked by 'deleted_at' field
//
const get_status_condition_sql = (table,record_status) => {

   if(is_permitted_table(table)) {
      switch(record_status) {
         case 'all_records':
            return ''
         case 'deleted_records':
            return `${table}.deleted_at IS NOT NULL`
         default:
            return `${table}.deleted_at IS NULL`
      }
   }
   return ''
}

//
//
//
const get_order_by_condition_sql = (table_name,order_by,direction) => {

   // if we want case-insensitive - eg 'title COLLATE NOCASE ASC'

   if(is_permitted_table(table_name)) {
      switch(order_by) {
         case 'deleted_at':
            return direction === 'ASC' ? 'deleted_at ASC ' : 'deleted_at DESC '
         default:
            return ''
      }
   }
   return ''
}


//
// Search tokenization - for basic search
//
const tokenize_search_term = (full_search_term) => {

   let tokens = []
   if(full_search_term.indexOf(' ') === -1) {
      tokens.push(full_search_term)
   }
   else {
      tokens = [full_search_term,...full_search_term.split(' ')]
   }
   return [...tokens.filter(token => token.length >= MIN_SEARCH_TERM_LEN) ]
}

//
//
//
const remove_stopwords = (search_term_tokens) => {
   // exlude common words from our searches
   let tokens = null
   if(search_term_tokens.length > 1) {
      tokens = search_term_tokens.filter(token => {
         return !search_excluded_words.includes(token)
      })
   }
   else {
      tokens = search_term_tokens
   }
   return tokens
}


// stopword list
//
const search_excluded_words = [
   'also','and','are','been','but','for','from',
   'has','have','not','our',
   'than','that','the','their','them','then','there','these','this',
   'was','were','with',
]

//
// 2-char words we exclude from above since our search sets min 3-char search_terms
// 'an','as','at','be','by','if','in','is','of','on','or','so','to','we',
//
// unlikely stopwords we exclude from above since we don't expect any frequent issue
// 'because','however','whatever',whether','which','would'
//



module.exports = {
   SEARCH_FIELDS,
   MIN_SEARCH_TERM_LEN,
   get_status_condition_sql,
   get_order_by_condition_sql,
   tokenize_search_term,
   remove_stopwords,
}