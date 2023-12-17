



// import will take in a csv file (as per export files)

// it will map this to a object similar to full_fields in CollectionItem

// eg 

// static #map_fields = [
//    {key:'file_name',sql:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:5,max:255}},
//    {key:'parent_folder_path',sql:'TEXT NOT NULL',editable:true,in_card:false,export:true,test:{type:'string',min:1,max:255}},
//    {key:'id',sql:'INTEGER PRIMARY KEY',editable:false,in_card:false,export:true,test:{type:'int',min:1,max:9999999999}},
//    {key:'title',sql:'TEXT NOT NULL',editable:true,in_card:true,export:true,test:{type:'string',min:3,max:100}}
// }

// - where each key corresponds to the same position on rcvd csv file

// - where each map_field can specify eg
//   - exclude me
//   - map me to 'xxx' col in table

// etc

