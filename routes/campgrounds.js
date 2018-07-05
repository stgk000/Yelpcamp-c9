var express = require("express"),
    Campground = require("../models/campground"),
    router = express.Router({ mergeParams: true }),
    nodeGeocoder = require("node-geocoder");

//middleware
var middleware = require("../middleware/index")

//=========================
//CAMPGROUNDS ROUTES
//=========================

//setting up geocoder 
var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = nodeGeocoder(options);

//index page
router.get("/", function(req, res) {
    Campground.find({}, function(err, camps) {
        if (!err) {
            console.log("find Working");
            res.render("campgrounds/index", { camps: camps, page: "campgrounds" });
        }
    });
});

//create route
router.post("/", middleware.isLoggedIn, function(req, res) {
    geocoder.geocode(req.body.location, function(err, data) {
        if (!err && data.length) {
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            Campground.create({
                name: req.body.name,
                image: req.body.image,
                desc: req.body.desc,
                price: req.body.price,
                author: {
                    id: req.user._id,
                    username: req.user.username
                },
                location: location,
                lat: lat,
                lng: lng
            }, function(err, camp) {
                if (!err && camp)
                    res.redirect("/campgrounds");
                else {
                    console.log(err);
                    res.redirect("back");
                }
            });
        } else {
            console.log(err);
            req.flash("error", "invalid Address");
            res.redirect("back");
        }
    });
});

//create page
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new");
});

//show route
router.get("/:id", function(req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
        if (!err && foundCampground) {
            res.render("campgrounds/show", { camp: foundCampground });
        } else {
            console.log(err);
            req.flash("error", "Couldn't show the following Campground");
            res.redirect("back");
        }
    });
});

//edit
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkOwner, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (!err && foundCampground) {
            res.render("campgrounds/edit", { camp: foundCampground });
        } else {
            req.flash("error", err.message);
            res.redirect("back");
        }
    });
});

//update
router.put("/:id", middleware.isLoggedIn, middleware.checkOwner, function(req, res) {
    geocoder.geocode(req.body.location, function(err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        } else {
            req.body.camp.lat = data[0].latitude;
            req.body.camp.lng = data[0].longitude;
            req.body.camp.location = data[0].formattedAddress;
        }
    });
    Campground.findByIdAndUpdate(req.params.id, req.body.camp, function(err, updatedCampground) {
        if (!err && updatedCampground) {
            req.flash("info", "You updated the campground");
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            console.log(err);
            req.flash("error", err.message);
            res.redirect("back");
        }

    });
});

//delete
router.delete("/:id", middleware.isLoggedIn, middleware.checkOwner, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err) {
        if (!err) {
            req.flash("info", "You deleted the campground");
            res.redirect("/campgrounds");
        } else {
            req.flash("error", "Something's not right");
            res.redirect("back");
        }
    })
})

module.exports = router;