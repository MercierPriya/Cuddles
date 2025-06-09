const mongoose=require('mongoose');

const ParentSchema = new mongoose.Schema({
    name:String,
    email:{type:String,unique:true},
    password:String,
    phone:String,
    location:String,
    profileImage:String,
    role: { type: String, enum: ["parent", "admin"], default: "parent" },
   children:[
            {name:String,
             age:Number}
            ]  ,
   notifications: [{ message: String,  
                    link: String,
                    isRead: {
                        type: Boolean,
                        default: false
                    },  createdAt: {
                        type: Date,
                        default: Date.now
                    },
                date:Date}] ,
   resetPasswordToken: { type: String }, // Token pour réinitialisation
   resetPasswordExpires: { type: Date }  // Expiration du token
});

const Parent= mongoose.model("Parent",ParentSchema);
module.exports = Parent;