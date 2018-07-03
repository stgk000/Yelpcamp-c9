var express = require("express"),
    passport = require("passport"),
    User = require("../models/user"),
    router = express.Router();

//home page
router.get("/", function(req, res){    
    res.render("home");
});

//=========================
//Auth Routes
//========================

//register
router.get("/register", function(req, res) {
    res.render("register", {page: "register"});
});

router.post("/register", function(req, res) {
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(!err){
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "Welcome To YelpCamp " + user.username + " !!");
                res.redirect("/campgrounds");
            });
        } else {
            req.flash("error", err.message);
            console.log(err);
            res.redirect("/register");
        }
    });
})
;
//login
router.get("/login", function(req, res) {
    res.render("login", {page: "login"});
});

router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

//logout
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success","You Have Logged Out");
    res.redirect("/campgrounds");
});


module.exports = router;