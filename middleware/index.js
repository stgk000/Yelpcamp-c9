var Campground = require("../models/campground"),
    Comment = require("../models/comment");

//All the middleware
module.exports = {
    checkOwner: function(req, res, next){
                    if(req.isAuthenticated()){
                        Campground.findById(req.params.id, function(err, foundCampground){
                            if(!err && foundCampground){
                                if(foundCampground.author.id.equals(req.user._id)){
                                    next();
                                } else {
                                    req.flash("error", "You don't have permission to do that");
                                    res.redirect("back");
                                } 
                            } else {
                                console.log(err);
                                req.flash("error", "No Campground found")
                                res.redirect("/campgrounds");
                            }
                        });
                    } else {
                        req.flash("error", "You need to be Logged In")
                        res.redirect("back");
                    }
                },
    isLoggedIn: function(req, res ,next){
                    if(req.isAuthenticated()){
                        return next();
                    }
                    req.flash("error", "You need to be Logged In")
                    res.redirect("/login");
                },
    checkOwnerComment: function(req, res, next){
                            if(req.isAuthenticated()){
                                Comment.findById(req.params.comment_id, function(err, foundComment){
                                    if(!err && foundComment){
                                        if(foundComment.author.id.equals(req.user._id)){
                                            next();
                                        } else {
                                            req.flash("error", "You don't have Permission to do that")
                                            res.redirect("back");
                                        } 
                                    } else {
                                        console.log(err);
                                        req.flash("error","No comment found")
                                        res.redirect("back");
                                    }
                                });
                            } else {
                                res.redirect("back");
                            }
                        }
}