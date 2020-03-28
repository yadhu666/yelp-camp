var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
    title: String,
    image: String,
    description: String,
    comment: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("Campground", campgroundSchema);