//express -- javascript's framework to create server easily.

const express=require("express");
const mongoose=require("mongoose");
const model=require("./model/userdata")
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const dotenv=require("dotenv");
const cors=require("cors"); //use npm install cors
dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());

//frontend--> request--> body --> json --> javascript convert }  --> express.json---> javascript object

//mongo db url= mongodb+srv://test:test@cluster0.e3h0oy3.mongodb.net/?retryWrites=true&w=majority

const mongo_url=process.env.MONGO_DB_URL;

mongoose.connect(mongo_url,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
});



const port = process.env.PORT || 5000;//ports are basically a number which are required to connect with right service.
const salt=process.env.SALT; //plaintext+ bcrypt generates random string

const privateKey=process.env.PRIVATE_KEY;

//localhost:5000/
// --> request to register --> middleware ---> callback function

app.post("/register",async(req,res)=>{  
  const { name, userName, password } = req.body;

  const avtaar = +Math.floor(Math.random()*3)+1;

   //plaintext --> encrypt --> undecodable string --> use library bcrypt
   const encryptedPassword = await bcrypt.hash(password,salt);

   try{
   const newUser= await model.create({
      // creating a document for a particular user...
    username: userName,
    password:encryptedPassword,
    name:name,
    avtaar:avtaar,

   });

   res.json({status:"true", message:"user registered...."});
}
catch(err){
    if(err.code=="11000"){
        res.json({status:"false", message:"username Already exist.."});
    }
    else{
        res.json({status:"false", message:"some error...."});
    }
  }
});

app.post("/login", async (req, res)=>{
  const { userName, password: userPassword } = req.body;
   try{
    const databaseuser = await model.findOne({ username: userName }); // We are finding the user in the database...whoose username mathces with the username entered by the user...

       if(databaseuser){
        var ePass=await databaseuser.password;
        const isPassCorrect= await bcrypt.compare(userPassword,ePass);

        if(isPassCorrect){
            const userToken= await jwt.sign({
                userName: databaseuser.username,
                id: databaseuser._id,
            },privateKey
            );// We are creating a JWT by signing it with secret key

            res.json({status:"true", message:"Login Successful", token:userToken,});
        }
        else{
            res.json({status:"false", message:"username/password is incorrect"});
        }
       }
       else{
        res.json({status:"false", message:"username/password is incorrect"});
       }
   }
   catch(err){
    res.json({
        status:"false",
        message:" some error occurred",
    })

   }
});
//Proteceted Routes -- these routes only accesed when user will have valid jwwt token

app.post("/getdetails", async(req, res)=>{
  const token= req.body.token;

  try{
      const userDetails=await jwt.verify(token, privateKey);
      if(userDetails){
        const userName=userDetails.userName;
        try{
            const databaseuser = await model.findOne({ username: userName });

            res.json({
                status: "true",
                message: "user details",
                userDetails: {
                  name: databaseuser.name,
                  avtaar: databaseuser.avtaar,
                  todos: databaseuser.todos,
                },
              });

        }catch(err){
            res.json({ status: "false", message: "user not verified" });
        }
      }else{
        res.json({ status: "false", message: "user not verified" });
      }   
  }
  catch(err){
    res.json({ status: "false", message: "user auth invalid" });
  }
});

app.post("/addtodo", async(req, res)=>{
    const { token, text, priority, isCompleted, date } = req.body;

    try {
      const userDetails = jwt.verify(token, privateKey);
      if (userDetails) {
        const userName = userDetails.userName;
  
        try {
          const addtodo = await model.updateOne( { username: userName },
            {
              $push: {
                todos: {
                  text: text,
                  priority: priority,
                  isCompleted: isCompleted,
                  date: date,
                },
              },
            }
          );
          const databaseuser = await model.findOne({ username: userName });
  
          res.json({
            status: "true",
            message: "todo added",
            userDetails: { todos: databaseuser.todos },
          }); //specific todo details to be sent
        } catch (err) {}
      } else {
        res.json({ status: "false", message: "user not verified" });
      }
    } catch (err) {
      res.json({ status: "false", message: "user not verified" });
    }

});

app.post("/deletetodo", async(req, res)=>{
    const { token, id } = req.body;
  try {
    const userDetails = jwt.verify(token, privateKey);
    if (userDetails) {
      const userName = userDetails.userName;
      const idTodo = id;

      try {
        const deleteTodo = await model.updateOne(
          { $and: [{ username: userName }, { "todos._id": idTodo }] },
          {
            $pull: {
              todos: {
                _id: idTodo,
              },
            },
          }
        );
        const databaseuser = await model.findOne({ username: userName });

        res.json({
          status: "true",
          message: "todo deleted",
          userDetails: { todos: databaseuser.todos },
        }); //specific todo details to be sent
      } catch (err) {
        console.log(err);
      }
    } else {
      res.json({ status: "false", message: "user not verified" });
    }
  } catch (err) {
    res.json({ status: "false", message: "user not verified" });
  }
});
app.post("/edittodo", async (req, res) => {
    const { token, id, text, priority, date } = req.body;
  
    try {
      const userDetails = jwt.verify(token, privateKey);
      if (userDetails) {
        const userName = userDetails.userName;
  
        try {
          const editodo = await model.updateOne(
            { $and: [{ username: userName }, { "todos._id": id }],},
            {
              $set: {
                "todos.$.text": text,
                "todos.$.priority": priority,
                "todos.$.date": date,
              },
            }
          );
  
          const databaseuser = await model.findOne({ username: userName });
  
          res.json({
            status: "true",
            message: "todo edited",
            userDetails: { todos: databaseuser.todos },
          }); //specific todo details to be sent
        } catch (err) {
          console.log(err);
        }
      } else {
        res.json({ status: "false", message: "user not verified" });
      }
    } catch (err) {
      res.json({ status: "false", message: "user not verified" });
    }
  });
  
app.post("/completedtodo", async (req, res) => {
    const { token, id, isCompleted } = req.body;
  
    try {
      const userDetails = jwt.verify(token, privateKey);
      if (userDetails) {
        const userName = userDetails.userName;
  
        try {
          const completedtodo = await model.updateOne(
            {
              $and: [{ username: userName }, { "todos._id": id }],
            },
            {
              $set: {
                "todos.$.isCompleted": isCompleted,
              },
            }
          );
  
          const databaseuser = await model.findOne({ username: userName });
  
          res.json({
            status: "true",
            message: "completed status changed",
            userDetails: { todos: databaseuser.todos },
          }); //specific todo details to be sent
        } catch (err) {
          console.log(err);
        }
      } else {
        res.json({ status: "false", message: "user not verified" });
      }
    } catch (err) {
      res.json({ status: "false", message: "user not verified" });
    }
  });
  
  // End of Protected Routes

app.use(express.static("build"));
  
  // Set server to Listen State
app.listen(port, ()=> {
     console.log("server is running at http://localhost:"+port);
});