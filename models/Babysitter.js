const mongoose = require("mongoose");

const BabysitterSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    age:Number,
    profileImage:String,
    experience: Number,
    location: String,
    role: { type: String, default: "babysitter" },
    diploma: String,  // Spécifique au babysitter
    certificate: String, // Spécifique au babysitter
    identityCard: String, // Spécifique au babysitter
    criminalRecord: String, // Spécifique au babysitter
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    aboutMe: { type: String},
    education: String,
    experienceBabysitting: Number,
    experienceNounou: Number,
    hasChildren: String,
    smokes: String,
    hasDrivingLicense: String,
    characteristics: String,
    languages: String,
    skills: [String], // Tableau pour stocker les compétences
     notifications: [
    {
      message: String,
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],
    resetPasswordToken: { type: String }, // Token pour réinitialisation
    resetPasswordExpires: { type: Date }  // Expiration du token
}, { timestamps: true });

const Babysitter = mongoose.model("Babysitter", BabysitterSchema);

module.exports=Babysitter;