const express=require('express')
const router=express.Router()
const babysitterController=require('./../controllers/babysitter-controller')
const multer = require("multer");
const path=require('path');

// Définir le stockage des fichiers
// Initialize multer
// Configuration de multer pour les images
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });
// espace de stockage coté server
const session = require("express-session")

const auth=require('../middlewares/auth')
router.get('/babysitter-profile', auth,babysitterController.profile);  

router.get("/babysitter-status",(req, res) => {
    res.render("pages/babysitter-status", { messages: req.flash() || {info:[],error:[]} });
});

// Render babysitter-form.ejs when user clicks "Modifier"
router.get("/edit-profile/:id",babysitterController.getBabysitterForm)

// Route pour mettre à jour les informations du babysitter
router.post('/update-babysitter', upload.single('profileImage'),babysitterController.update)

//Route pour les notification
router.get('/babysitter-notification',babysitterController.getNotification);
//Handle the accept action
router.get('/accept/:id', babysitterController.acceptReservation);

// Handle Reject Action
router.get('/reject/:id', babysitterController.rejectReservation);

module.exports=router