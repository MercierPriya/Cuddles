const Parent = require('../models/Parent')
const Babysitter = require("../models/Babysitter");
const Reservation=require('../models/Reservation')

exports.profile = async (req, res) => { 
    try {
        // Check if the user session exists
        if (!req.session.user) {
            return res.redirect('/login'); // Redirect to login if session is missing
        }

        const babysitter = await Babysitter.findOne({ email: req.session.user.email });

        // If babysitter does not exist, redirect to login (or handle it accordingly)
        if (!babysitter) {
            return res.redirect('/login'); 
        }

         // Flash message for pending status
         if (babysitter.status === "pending") {
            req.flash("info", "Votre profil est en cours de vérification.");
            return res.redirect("/babysitter-status"); // Redirect to a status page
        }

        // Flash message for rejected status
        if (babysitter.status === "rejected") {
            req.flash("error", "Votre profil a été rejeté. Veuillez contacter l'administration.");
            return res.redirect("/babysitter-status"); // Redirect to a status page
        }

        if (babysitter.status === "approved") {
            req.session.user.status = "approved"; // Update session
        }
        
         // Récupérer toutes les réservations faites à ce babysitter
         const reservationsCount = await Reservation.countDocuments({ babysitterId: babysitter._id });
        const unreadCount = babysitter.notifications.filter(n => !n.isRead).length;
        // Set profile image in session, use default if not available
        req.session.user.profileImage = babysitter.profileImage || '/images/default.jpg';

        res.render('pages/babysitter-profile', { 
            user: req.session.user, 
            babysitter ,
            reservationsCount,
            unreadCount,
            messages: req.flash() 
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
};
exports.getBabysitterForm = async (req, res) => { 
    try {
        console.log("Session User ID:", req.session.user.id)
        // const babysitter = await Babysitter.findById(req.session.userId); // Fetch babysitter from DB
        const babysitterId = req.params.id;
        console.log("Babysitter ID:", babysitterId); // Vérification de l'ID reçu
        if (!babysitterId) {
            return res.status(404).send("ID du babysitter manquant");
        }
        const babysitter = await Babysitter.findById(babysitterId);
        console.log("Babysitter trouvé:", babysitter); // Vérification du résultat

        if (!babysitter) {
            return res.status(404).send("Babysitter non trouvé");
        }
        res.render("pages/babysitter-form", { babysitter }); // Pass babysitter data to EJS
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};
exports.update= async (req, res) => {
    try {
        const babysitterId =  req.session.user.id; // Récupérer l'ID du babysitter connecté
          // Récupérer les compétences et les convertir en tableau
        const skills = req.body.skills.split(',').map(skill => skill.trim());

        const updateData = {
            age: req.body.age,
            aboutMe: req.body.aboutMe,
            education: req.body.education,
            experienceBabysitting: req.body.experienceBabysitting,
            experienceNounou: req.body.experienceNounou,
            hasChildren: req.body.hasChildren,
            smokes: req.body.smokes,
            hasDrivingLicense: req.body.hasDrivingLicense,
            characteristics: req.body.characteristics,
            languages: req.body.languages,
            contact: req.body.contact,
            skills: skills, // Mettre à jour les compétences
        };

        if (req.file) {
            updateData.profileImage = req.file.filename; // Ajouter l'image si elle est modifiée
        }

        const updatedUser=await Babysitter.findByIdAndUpdate(babysitterId, updateData, { new: true });
             req.session.user.profileImage = updatedUser.profileImage;
        res.redirect('/babysitter-profile'); // Rediriger vers le profil après mise à jour
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de la mise à jour du profil');
    }
}
exports.getNotification=async (req, res) => {
    try {
        const babysitterId = req.session.user.id; // Assuming babysitter is logged in
        console.log(babysitterId);

        const babysitter = await Babysitter.findById(babysitterId);
        const reservations = await Reservation.find({ babysitterId }).populate('parentId');
        const user = req.session.user; 

        // Get total reservations for this babysitter
        const reservationsCount = await Reservation.countDocuments({ babysitterId: babysitter._id });
            
          //  Mark all notifications as read only if they were unread
    const updatedNotifications = babysitter.notifications.map(n => {
      if (!n.isRead) n.isRead = true;
      return n;
    });

    babysitter.notifications = updatedNotifications;
    await babysitter.save(); // Save changes to DB

    // Now unreadCount becomes 0
    const unreadCount = 0;
            
        res.render('pages/babysitter-notification', { reservations , babysitter, user,reservationsCount,unreadCount,
          notifications: babysitter.notifications});
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors du chargement des réservations');
    }
}

//handle the accept request
exports.acceptReservation = async (req, res) => {
    try {
        const reservationId = req.params.id;
        const reservation = await Reservation.findById(reservationId)
        .populate("babysitterId", "name _id"); // Populate babysitter name
       
        if (!reservation) {
            return res.status(404).send('Reservation not found');
        }
        const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };

const startDate = new Date(reservation.startDate).toLocaleDateString("fr-FR", options);
const endDate = new Date(reservation.endDate).toLocaleDateString("fr-FR", options);
        reservation.status = 'confirmed'; // Update the status to confirmed
        await reservation.save();

        // Optionally, notify the parent 
        const parent = await Parent.findById(reservation.parentId);
        parent.notifications.push({
            message: `Votre demande de réservation pour ${reservation.childDetails[0].name} a été ${
                reservation.status === "confirmed" 
                    ? `**acceptée** par ${reservation.babysitterId?.name} du ${startDate} au ${endDate}` 
                    : ""
            }.`,
            link: `/babysitter-details/${reservation.babysitterId?._id}`, // Ensure valid babysitter ID
            date: new Date(),
        });
        
        await parent.save();

        res.redirect('/babysitter-notification'); // Redirect to the babysitter notification page
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while accepting the reservation');
    }
};

 // Handle Reject Action
exports.rejectReservation = async (req, res) => { 
    try {
        const reservationId = req.params.id;
        const reservation = await Reservation.findById(reservationId)
            .populate("babysitterId", "name"); // Populate babysitter name

        if (!reservation) {
            return res.status(404).send('Réservation non trouvée');
        }

        reservation.status = 'rejected'; // Update status to rejected
        await reservation.save();

        // Retrieve the parent
        const parent = await Parent.findById(reservation.parentId);
        if (!parent) {
            return res.status(404).send("Parent non trouvé");
        }

        // Format dates in French
        const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
        const startDate = new Date(reservation.startDate).toLocaleDateString("fr-FR", options);
        const endDate = new Date(reservation.endDate).toLocaleDateString("fr-FR", options);

        // Add notification for the parent
        parent.notifications.push({
            message: `Votre demande de réservation pour ${reservation.childDetails[0].name} du ${startDate} au ${endDate} a été **refusée**  
            par ${reservation.babysitterId?.name}.`,
            link: `/babysitter-profile/${reservation.babysitterId?._id}`, // Ensure valid babysitter ID
            date: new Date(),
        });

        await parent.save();

        res.redirect('/babysitter-notification'); // Redirect to babysitter notification page
    } catch (error) {
        console.error(error);
        res.status(500).send("Une erreur s'est produite lors du refus de la réservation.");
    }
};
