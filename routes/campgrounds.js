var express = require("express"),
    Campground = require("../models/campground"),
    router = express.Router({ mergeParams: true }),
    nodeGeocoder = require("node-geocoder"),
    multer = require("multer"),
    cloudinary = require("cloudinary");

//image upload setup
var storage = multer.diskStorage({
    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

var imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({
    storage: storage,
    fileFilter: imageFilter
})

cloudinary.config({
    cloud_name: 'dosc7chck',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({ name: regex }, function(err, camps) {
            if (!err) {
                if (camps.length < 1) {
                    req.flash("error", "No campgrounds found");
                    return res.redirect("/campgrounds")
                }
                res.render("campgrounds/index", {
                    camps: camps,
                    page: "campgrounds"
                });
            }
        });
    } else {
        Campground.find({}, function(err, camps) {
            if (!err) {
                console.log("find Working");
                res.render("campgrounds/index", {
                    camps: camps,
                    page: "campgrounds"
                });
            }
        });
    }
});

//image upload
router.post("/campgrounds/image", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
        // add cloudinary url for the image to the campground object under image property
        var image = result.secure_url;
    });
})

//create route
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    geocoder.geocode(req.body.location, function(err, data) {
        if (!err && data.length) {
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            //cloudinary setup
            cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                // add cloudinary url for the image to the campground object under image property
                var image = result.secure_url;
                var imageId = result.public_id;
                //creating campground
                Campground.create({
                    name: req.body.name,
                    image: image,
                    imageId: imageId,
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
            })
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
router.put("/:id", middleware.isLoggedIn, middleware.checkOwner, upload.single('image'), async function(req, res) {
    try {
        let data = await geocoder.geocode(req.body.location)
        req.body.camp.lat = data[0].latitude;
        req.body.camp.lng = data[0].longitude;
        req.body.camp.location = data[0].formattedAddress;
    } catch (err) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
    }
    Campground.findById(req.params.id, async function(err, campground) {
        if (!err && campground) {
            if (req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(campground.imageId);
                    let result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.image = result.secure_url;
                    campground.imageId = result.public_id;
                } catch (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
            }
            campground.name = req.body.camp.name;
            campground.desc = req.body.camp.desc;
            campground.price = req.body.camp.price;

            campground.save();
            req.flash("info", "You have Updated the campground");
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
    Campground.findById(req.params.id, async function(err, campground) {
        if (!err && campground) {
            try {
                await cloudinary.v2.uploader.destroy(campground.imageId);
                campground.remove();
                req.flash("info", "You have deleted the campground");
                res.redirect("/campgrounds");
            } catch (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
        } else {
            console.log(err);
            req.flash("error", err.message);
            res.redirect("back");
        }
    })
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;