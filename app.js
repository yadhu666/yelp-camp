var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    localStrategy = require("passport-local"),
    User        = require("./models/user"),
    Campground  = require("./models/campgrouds"),
    Comment     = require("./models/comments");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
mongoose.connect('mongodb://localhost:27017/yelp_camp', {useNewUrlParser: true, useUnifiedTopology: true});

//PASSPORT CONFIG
app.use(require("express-session")({
    secret: "Yelpcamp app Secret Session",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

app.get("/", function(req, res){
    res.render("landing");
});

app.get("/campgrounds", function(req, res){
    Campground.find({}, function(err, campgrounds){
        if(err){
            console.log(err);
        }else{
            res.render("./campgrounds/index", {campgrounds: campgrounds});
        }
    });
    
});

app.get("/campgrounds/new", function(req, res){
    res.render("./campgrounds/new");
});

app.post("/campgrounds", function(req, res){
    Campground.create(req.body.camp, function(err, camp){
        if(err){
            console.log(err);
        }else{
            res.redirect("/campgrounds");
        }
    });
});

app.get("/campgrounds/:id", function(req, res){
    Campground.findById(req.params.id).populate("comment").exec(function(err, campground){
        if(err){
            console.log(err);
        }else{
            res.render("./campgrounds/show", {campground:campground});
        }
    });
});

app.get("/campgrounds/:id/comments/new",isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        }else{
            res.render("./comments/new", {campground:campground});
        }
    });
});

app.post("/campgrounds/:id/comments",isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        }else{
            Comment.create(req.body.comment, function(err, comm){
                if(err){
                    console.log(err);
                }else{
                    comm.author.id = req.user._id;
                    comm.author.name = req.user.username;
                    comm.save();
                    campground.comment.push(comm);
                    campground.save();
                    res.redirect("/campgrounds/"+campground._id);
                }
            });
        }
    });
});

//Auth Routes
app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/campgrounds");
        });
    });
});

app.get("/signin", function(req, res){
    res.render("signin");
});

app.post("/signin", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/signin"
}), function(req, res){
});

app.get("/logout", function(req, res){
     req.logout();
     res.redirect("/campgrounds");
});

//  MIDDLE WARE
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("signin");
}

app.listen(3000, function(){
    console.log("Server running!");
});