var express = require("express"),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    router = express.Router({mergeParams: true});

//middleware
var middleware = require("../middleware");
    
//=========================
//COMMENT ROUTES
//=========================

//Comments New 
router.get("/new", middleware.isLoggedIn, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground){
        if(!err && foundCampground)
            res.render("comments/new", {camp: foundCampground});
        else {
            req.flash("error",err.message);
            res.redirect("back");
        }
    });
});

//comment create
router.post("/", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(!err && foundCampground) {
            Comment.create(req.body.comment, function(err, comment){
                if(!err && comment){
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    foundCampground.comments.push(comment);
                    foundCampground.save();
                    req.flash("success", "Succesfully added Comment");
                    res.redirect("/campgrounds/" + foundCampground._id);
                } else {
                    req.flash("error", err.message)
                    res.redirect("back")
                }
            })
        }
        else {
            req.flash("error", err.message)
            res.redirect("back")
        }
    })
})

//edit comment
router.get("/:comment_id/edit", middleware.isLoggedIn, middleware.checkOwnerComment, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(!err && foundCampground) {
            Comment.findById(req.params.comment_id, function(err, foundComment){
                if(!err && foundComment){
                    res.render("comments/edit", {camp: foundCampground, comment: foundComment});                    
                } else {
                    req.flash("error", err.message)
                    res.redirect("back")
                }
            })
        } else {
            req.flash("error", err.message)
            res.redirect("back")
        }
    })
})

//update comment
router.put("/:comment_id", middleware.isLoggedIn, middleware.checkOwnerComment, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(!err && updatedComment){
            req.flash("info", "You have updated the comment")
            res.redirect("/campgrounds/" + req.params.id);                    
        } else {
            req.flash("error", err.message)
            res.redirect("back")
        }
    })
})

//destroy comment
router.delete("/:comment_id", middleware.isLoggedIn, middleware.checkOwnerComment, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(!err){
            req.flash("info", "You have deleted the comment")
            res.redirect("/campgrounds/" + req.params.id);
        }
        else
            console.log(err);
            req.flash("error", err.message)
            res.redirect("back")
    });
})

module.exports = router;