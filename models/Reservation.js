const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent', // Référence au modèle Parent
        required: true
    },
    babysitterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Babysitter', // Référence au modèle Babysitter
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    timePreference: {
        type: String,
        enum: ['matin', 'apres-midi', 'soir', 'nuit'], // Options pour la préférence horaire
        required: true
    },
    
    childDetails: [{
        name: String,
        age: Number
    }],
    phone: {
        type: String,
        required: true
    },
   specialRequest: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
