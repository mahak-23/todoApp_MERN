const mongoose = require("mongoose");

const todoItem=new mongoose.Schema({

   text:{type:String, required:true},
   priority:{type: String, default:"regular"},
   date:{type:String, default:"12/12/2050"},
   isCompleted:{type: Boolean, default:false},
        // We declared the structure of todoitem ..see UserData--->todos
});

const userData = new mongoose.Schema({
       
    username: {type:String, require:true, unique:true},
    name: {type: String, require:true},
    password:{type:String, require:true},
    avtaar:{type:String, default: "avtaar-0"},
    todos:[todoItem],

});// This is how we are storing the user's data in mongodb


const model=mongoose.model("userData", userData);// we are sving this as model...

module.exports=model;// exporting model to use it in different file