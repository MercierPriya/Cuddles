const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const Parent = require('../models/Parent')
const Babysitter = require("../models/Babysitter");
const Reservation=require('../models/Reservation')
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { log } = require('console');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
    //    console.log(req.body)
    
        // Check in both collections
        let user = await Parent.findOne({ email });
        let userType = "parent"; 

        if (!user) {
            user = await Babysitter.findOne({ email });
            userType = "babysitter";
        }

        if (!user) {
            return res.render("pages/forgot-password", { message: "Email non trouvé" });
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration

        await user.save(); // Save token and expiration in the database

        require("dotenv").config();
        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail", // Utiliser le service Gmail
            auth: {
                user: process.env.EMAIL_USER, // valeurs sont bien défini en .env
                pass: process.env.EMAIL_PASS  // Utilisé un mot de passe d'application si 2FA est activé
            }
        });
        
        // Email content
        const resetURL = `http://localhost:3000/reset-password/${token} `;
        const mailOptions = {
            to: user.email,
            from:process.env.EMAIL_USER ,
            subject: "Réinitialisation du mot de passe",
            text: `Bonjour ${user.name},\n\nVous avez demandé une réinitialisation de mot de passe.
            \nCliquez sur le lien suivant pour réinitialiser votre mot de passe :\n\n${resetURL}\n
            \nSi vous n'avez pas fait cette demande, ignorez cet email.\n`
        };

        // Send email with async/await
        await transporter.sendMail(mailOptions);

        res.render("pages/forgot-password", { message: "Un email a été envoyé pour réinitialiser votre mot de passe !" });

    } catch (error) {
        console.error("Erreur dans la réinitialisation du mot de passe :", error);
        res.render("pages/forgot-password", { message: "Une erreur s'est produite. Veuillez réessayer plus tard." });
    }
};
exports.resetPasswordView=  async (req, res) => {
    try {
        const user = await Parent.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }) ||
                     await Babysitter.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

        if (!user) {
            return res.render("pages/reset-password", { message: "Lien invalide ou expiré", token: req.params.token });
        }

        res.render("pages/reset-password", { message: null, token: req.params.token });

    } catch (error) {
        console.error(error);
        res.render("pages/reset-password", { message: "Une erreur s'est produite." });
    }
}
exports.resetPassword= async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const token = req.params.token;

        // Vérifier si les mots de passe correspondent
        if (password !== confirmPassword) {
            return res.render("pages/reset-password", { message: "Les mots de passe ne correspondent pas.", token });
        }

        // Vérifier si le token est valide
        const user = await Parent.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }) ||
                     await Babysitter.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

        if (!user) {
            return res.render("pages/reset-password", { message: "Lien invalide ou expiré.", token });
        }

        // Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.render("pages/login", { message: "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter." });

    } catch (error) {
        console.error(error);
        res.render("pages/reset-password", { message: "Erreur lors de la réinitialisation.", token: req.params.token });
    }
}
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await Parent.findOne({ email });
        let role = user ? user.role : null; // Récupérer le rôle du parent s'il existe

        if (!user) {
            user = await Babysitter.findOne({ email });
            role = "babysitter";
        }

        if (!user) {
            return res.render("pages/login", { message: "Email ou mot de passe incorrect" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("pages/login", { message: "Email ou mot de passe incorrect" });
        }

        // Stocker l'utilisateur en session
        req.session.user = { id: user._id, role, email: user.email,
            profileImage: user.profileImage || "default.jpg" };

        // Rediriger selon le rôle
        if (role === "admin") {
            return res.redirect("/admin-dashboard");
        } else if (role === "parent") {
            return res.redirect("/parent-profile");
        } else if (role === "babysitter") {
            return res.redirect("/babysitter-profile");
        }

    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};
exports.admin=async (req, res) => {
    if (req.session.user && req.session.user.role === "admin") {
        const pendingBabysitters = await Babysitter.find({ status: "pending" });
        res.render("pages/admin-dashboard", { babysitters: pendingBabysitters, user: req.session.user  });
    } else {
        res.redirect("/login");
    }
}

exports.updateBabysitterStatus = async (req, res) => {
    const { action } = req.body;

    let status;
    if (action === "approve") {
        status = "approved";
    } else if (action === "reject") {
        status = "rejected";
    } else {
        status = "pending"; // Default to "pending"
    }

    if (req.session.user && req.session.user.role === "admin") {
        await Babysitter.findByIdAndUpdate(req.params.id, { status });
        res.redirect("/admin-dashboard");
    } else {
        res.status(403).send("Accès refusé");
    }
};

exports.register=async(req,res)=>{
       console.log(req.body);
       
        const { name, email, password, phone, location, role, experience,age} = req.body;

         //  email and password validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

 
  if (!email || !password) {
    return res.render('pages/register', { error: 'Email et mot de passe sont requis.' });
  }

  if (!emailRegex.test(email)) {
    return res.render('pages/register', { error: 'Adresse email invalide.' });
  }

  if (password.length < 6) {
    return res.render('pages/register', { error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

    
        try {
             // Vérifier si l'email existe dans la collection correspondante uniquement
        if (role === 'parent') {
            const parentExist = await Parent.findOne({ email });
            if (parentExist) {
                return res.status(400).json({ message: "Ce parent est déjà inscrit avec cet email." });
            }
        } else if (role === 'babysitter') {
            const babysitterExist = await Babysitter.findOne({ email });
            if (babysitterExist) {
                return res.status(400).json({ message: "Ce babysitter est déjà inscrit avec cet email." });
            }
        } 
         else {
            return res.status(400).json({ message: "Rôle invalide. Choisissez 'parent' ou 'babysitter'." });
        }

            const hashedPassword = await bcrypt.hash(password, 10);
               // Création du nouvel utilisateur
            let user;
            if (role === "parent") {
                  // Créer la liste des enfants
                console.log(req.body.children);
              user = new Parent({ ...req.body,
                                   password: hashedPassword,
                                   children:req.body.children});
            } else if (role === "babysitter") {
                     // Enregistrement pour les babysitters
            const { diploma, certificate, identityCard, criminalRecord, profileImage } = req.files || {};
                user = new Babysitter({
                    name,
                    email,
                    password: hashedPassword,
                    phone,
                    age,
                    location,
                    experience,
                    role,
                    diploma: diploma ? diploma[0].filename : null,  // Stocke uniquement le nom du fichier
                    certificate: certificate ? certificate[0].filename : null,
                    identityCard: identityCard ? identityCard[0].filename : null,
                    criminalRecord: criminalRecord ? criminalRecord[0].filename : null,
                    profileImage: profileImage && profileImage[0] ? profileImage[0].filename : "default.jpg",
                    status: "pending",
                });

            } 
            else {
                return res.status(400).json({ message: "Rôle invalide" });
            }
    
            await user.save();
             res.redirect('/login');

        } catch (error) {
            res.status(500).json({ message: "Erreur serveur", error });
        }
    }

exports.search = async (req, res) => {
  try {
    const { location } = req.query;

    const parent = await Parent.findById(req.session.user.id);
    if (!parent) return res.status(404).send("Parent not found");

    const parentCity = parent.location;
    const allBabysitters = await Babysitter.find({});
    const sameCityBabysitters = allBabysitters.filter(
      (b) => b.location.toLowerCase() === parentCity.toLowerCase()
    );

    // search results
    let searchResults = [];
    if (location) {
      searchResults = allBabysitters.filter((b) =>
        b.location.toLowerCase().includes(location.trim().toLowerCase())
      );
    }

    const unreadNotificationCount = parent.notifications.filter((n) => !n.isRead).length;

    res.render("pages/parent-profile", {
      user: req.session.user,
      sameCityBabysitters,
      allBabysitters,
      searchResults, 
      location,
      messages: req.flash(),
      unreadNotificationCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur serveur");
  }
};

exports.details=async(req,res)=>{
    try{
        console.log(req.params.id)
        const babysitter = await Babysitter.findById(req.params.id);
        if (!babysitter) {
            return res.status(404).send("Babysitter non trouvé");
        }
        res.render("pages/babysitter-details", { babysitter });
    }
    catch(error){
        console.error(error);
        res.status(500).send("Erreur serveur");
    }
} 
exports.getUpdateParent=async(req,res)=>{
    try{console.log(req.params.id);
    const parent=await Parent.findById(req.params.id);
    if (!parent) return res.status(404).send('Parent non trouvé');
    res.render('pages/parent-form',{parent})}
    catch(err){
        res.status(500).send('Server error')
    } 
  }
  exports.postUpdateParent=async (req, res) => {
    const id = req.session.user.id;
    console.log(req.body);
    const { name, phone, location, children} = req.body;
    const profileImage=req.file.filename;
try{
   const user= await Parent.findByIdAndUpdate(id, { name, email, phone, location, children,profileImage });
    res.render('pages/parent-profile', { user });
}
    catch(err){
        console.error(err);
        res.status(500).send("Erreur lors de la mise à jour du profil");
    }
}


exports.reserve=async (req, res) => {
    try {

        const babysitterId = req.query.babysitterId; // Assuming you're getting the babysitter ID from the query params
        console.log(babysitterId);
        
        const babysitter = await Babysitter.findById(babysitterId); // Fetch the babysitter data
        
        if (!babysitter) {
            return res.status(404).send('Babysitter not found');
        }

        // Fetch the parent data 
        const parent = await Parent.findById(req.session.user.id); // Get parent details
         console.log(parent)
        res.render('pages/reserve', {
            babysitter, // Pass babysitter data to the view
            parent      // Pass parent data to the view
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching data');
    }
};
exports.postReserve=(req, res) => {
    console.log('hello post reserve');
    const {parentId, babysitterId, startDate, endDate, timePreference, phone, specialRequest } = req.body;
      
    const children = req.body.childDetails || [];
    const childDetails = children.map(child => {
        const [name, age] = child.split('-');
        return { name, age: parseInt(age) };
    });

    //store in database
    const newReservation = new Reservation({
        parentId:parentId,
        babysitterId: babysitterId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        timePreference,
        numberOfChildren:childDetails.length,
        childDetails,  
        phone,
        specialRequest,
    });

    newReservation.save()
        .then(async() => {
             // Add notification to babysitter
        await Babysitter.findByIdAndUpdate(babysitterId, {
            $push: {
                notifications: {
                    message: `Nouvelle demande de réservation du ${newReservation.startDate.toLocaleDateString()}`,
                    isRead: false,
                    createdAt: new Date()
                }
            }
        });
            req.flash('success', 'Réservation envoyée avec succès ! Le babysitter prendra une décision. Merci de patienter.');
            res.redirect('/parent-profile');  // Redirection vers le profil du parent
        })
        .catch((err) => {
            console.error(err);
            req.flash('error', 'Erreur lors de la réservation. Veuillez réessayer.');
            res.redirect('/reserve');  // Redirection vers la page de réservation en cas d'erreur
        });
}

exports.getParentNotifications = async (req, res) => {
    try {
        // Vérifier si l'utilisateur est connecté
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).send("Utilisateur non connecté");
        }

        const parentId = req.session.user.id;

        // Récupérer le parent et ses notifications
        const parent = await Parent.findById(parentId);

        if (!parent) {
            return res.status(404).send("Parent non trouvé");
        }

        // Récupérer toutes les réservations faites par ce parent
        const reservations = await Reservation.find({ parentId })
            .populate("babysitterId", "name phone") // Récupérer le nom et phone du babysitter
            .sort({ createdAt: -1 }); // Trier par date (les plus récentes en premier)
        
         // Calculer le nombre de notifications non lues
         const unreadNotificationCount = parent.notifications.filter(notification => !notification.isRead).length;
          res.locals.user = parent;
        res.render("pages/parent-notification", { 
            notifications: parent.notifications || [], 
            reservations, 
            parent ,
            unreadNotificationCount 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Une erreur s'est produite lors de la récupération des notifications.");
    }
};
exports.markAsRead=async (req, res) => {
    try {
        const { parentId, notificationId } = req.params;
  
        // Find the parent in the database
        const parent = await Parent.findById(parentId);
        if (!parent) {
            return res.status(404).json({ message: "Parent not found" });
        }
  
        // Find the notification inside the parent's notifications array
        const notification = parent.notifications.id(notificationId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
  
        // Mark notification as read
        notification.isRead = true;
  
        // Save the updated parent document
        await parent.save();
  
        res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while marking notification as read" });
    }
  }
