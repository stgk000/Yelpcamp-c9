var mongoose = require("mongoose");
var Comment = require("./comment")

var campSchema = new mongoose.Schema({
    name: String,
    image: String,
    desc: String,
    price: Number,
    location: String,
    lat: Number,
    lng: Number,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
});

module.exports = mongoose.model("Campground", campSchema);