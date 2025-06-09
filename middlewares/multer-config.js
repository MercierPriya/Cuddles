const multer=require('multer')
const path=require('path')
// Définir le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads'); // Stocke dans "public/uploads"
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase(); // Récupère l'extension du fichier
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  
      let newFilename;
  
      if (ext === ".pdf") {
        newFilename = file.fieldname + '-' + uniqueSuffix + ".pdf"; // Garde .pdf
      } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
        newFilename = file.fieldname + '-' + uniqueSuffix + ".webp"; // Convertit en .webp
      } else {
        return cb(new Error("Format de fichier non supporté ! Seuls les fichiers PDF, JPG et PNG sont acceptés."));
      }
  
      cb(null, newFilename);
    }
  });
  
  // Initialiser Multer avec des filtres de fichiers
  const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      
      if ([".pdf", ".jpg", ".jpeg", ".png"].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Seuls les fichiers PDF, JPG et PNG sont acceptés !"), false);
      }
    }
  });
  module.exports=upload