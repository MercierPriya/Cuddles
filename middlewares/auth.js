function auth(req, res, next){
    if (!req.session.user) {
        return res.redirect('/login'); // Redirige si l'utilisateur n'est pas connecté
    }

    res.locals.user = req.session.user; // Permet d'accéder à l'utilisateur dans toutes les vues
    console.log(req.session)
    next(); // Passer au prochain middleware ou route
    
}
module.exports=auth;