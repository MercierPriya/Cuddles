const express=require('express')
const path=require('path');
const router=express.Router()
const parentController=require('../controllers/parent-controller.js')
const multer = require("multer");

// Configuration de multer pour les images
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// espace de stockage coté server
const session = require("express-session")
//Route for home page
router.get("/", (req, res) => {res.render("pages/home"); 
})
// Route to render the login page
router.get("/login", (req, res) => {res.render("pages/login",{message:null}); }); 
  //route to verify login 
router.post("/login",parentController.login)
// Show the forgot password form
router.get("/forgot-password", (req, res) => { res.render("pages/forgot-password",{message:null});});
// Handle forgot password request
router.post("/forgot-password",parentController.forgotPassword);
// Show reset password form
router.get("/reset-password/:token",parentController.resetPasswordView);

// Handle password reset
router.post("/reset-password/:token",parentController.resetPassword);
//route to render inscription
router.get('/register',(req,res)=>{res.render('pages/register', {error:null});})

const upload=require('../middlewares/multer-config')
//route to verify inscription
router.post('/register',upload.fields([
  { name: 'diploma', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'identityCard', maxCount: 1 },
  { name: 'criminalRecord', maxCount: 1 },
  {name: 'profileImage', maxCount: 1 } // profile image field
]),parentController.register)

//route to parent-profile with search bar
const auth=require('../middlewares/auth');
router.get('/parent-profile', auth,parentController.search);  // vers parent profile
// Route pour afficher le profil d'un babysitter spécifique
router.get('/babysitter-details/:id',auth, parentController.details);
//route to update the parent profile
router.get("/update-parent/:id",parentController.getUpdateParent);
//route to post the update form
router.post('/update-parent/:id',upload.single('profileImage'), parentController.postUpdateParent);
//route to admin dashboard
const authAdmin=require('../middlewares/authAdmin')
router.get('/admin-dashboard',authAdmin,parentController.admin);
router.post('/update-babysitter-status/:id', parentController.updateBabysitterStatus);
// route to reserve the babysitter
router.get('/reserve',parentController.reserve);
//route to handle the reservation
router.post('/reserve',parentController.postReserve)
// Parent Notifications
router.get('/parent-notifications', parentController.getParentNotifications);
//  Route to mark notification as read
router.post('/parents/:parentId/notifications/:notificationId/mark-as-read', parentController.markAsRead);

//route to logout
router.get('/logout', (req, res) => { req.session.destroy(() => { res.redirect('/login');});})


//exporting router to app.js
module.exports=router  