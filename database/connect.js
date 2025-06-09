const mongoose = require('mongoose');
// connection de base de donnee
async function connectDb(){
    try{                                                                 
       await mongoose.connect(process.env.MONGO_URI+process.env.DB_NAME)  // waits for connect to the database in mongodb compass
        console.log(process.env.MONGO_URI+process.env.DB_NAME)        //connects .env file and fetch the variable MONGO_URI,DB_NAME 
        console.log('database is connected...')
    }
    catch(err){
           console.log(err);
           
    }
}

module.exports=connectDb