const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const csurf = require("csurf");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var cookieSession = require("cookie-session");
var bcrypt = require("bcryptjs");

//---------------------------
const {
    registration,
    signing,
    signersList,
    getSignatureById,
    getUserByEmail,
    profileInformationToTable,
    getSignersByCity,
    getUsersRegistration,
    updateProfileInUserProfiles,
    updateProfileInUsersWithPass,
    updateProfileInUsersNoPass,
    deleteSignature
} = require("./databaseRequests");

const { hashPassword, checkPassword } = require("./hashpassword");

const {
    requireNoSignature,
    requireSignature,
    requireUserId,
    requireLoggedOut
} = require("./routeMiddleware");

//---------------------------
//MIDDLEWARE
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
app.use(csurf());
app.use(function(req, res, next) {
    res.setHeader("X-Frame-Options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(express.static("public"));

//-----------------------------------------------------------------------------
//ROUTES

app.get("/", (req, res) => {
    res.redirect("/registration");
});
//-----------------------------
app.get("/registration", requireLoggedOut, (req, res) => {
    res.render("registrationV", {
        layout: "petitionLayout"
    });
});
//-----------------------------
app.post("/registration", (req, res) => {
    hashPassword(req.body.password)
        .then(hash => {
            return registration(
                req.body.first,
                req.body.last,
                req.body.email,
                hash
            );
        })
        .then(userId => {
            req.session.userId = userId.rows[0].id;
            req.session.first = userId.rows[0].first;
            req.session.last = userId.rows[0].last;
        })
        .then(() => {
            res.redirect("/profile");
        })
        .catch(err => {
            console.log(err);
            res.render("registrationV", {
                layout: "petitionLayout",
                error: "error"
            });
        });
});
//-----------------------------
app.get("/login", (req, res) => {
    res.render("loginV", {
        layout: "petitionLayout"
    });
});
//------------------------------
app.post("/login", (req, res) => {
    var userId;
    var sigId;

    getUserByEmail(req.body.email)
        .then(result => {
            userId = result.id;
            sigId = result.sigid;

            return checkPassword(req.body.password, result.hashpassword);
        })
        .then(doesMatch => {
            if (doesMatch) {
                req.session.email = req.session.email;
                req.session.userId = userId;
                req.session.sigId = sigId;

                return res.redirect("/thankyou");
            } else {
                throw new Error("Incorrect password");
            }
        })
        .catch(err => {
            console.log(err);
            res.render("loginV", {
                layout: "petitionLayout",
                error: "error"
            });
        });
});
//------------------------------
app.get("/profile", requireUserId, (req, res) => {
    res.render("profileV", {
        layout: "petitionLayout"
    });
});
//------------------------------
app.post("/profile", (req, res) => {
    if (!req.body.age && !req.body.city && !req.body.homepage) {
        return res.redirect("/petition");
    }
    profileInformationToTable(
        req.session.userId,
        req.body.age,
        req.body.city,
        req.body.homepage
    )
        .then(() => {
            res.redirect("/petition");
        })
        .catch(err => {
            console.log(err);
            res.render("profileV", {
                layout: "petitionLayout",
                error: "error"
            });
        });
});
//------------------------------
app.get("/edit_profile", (req, res) => {
    getUsersRegistration(req.session.userId).then(results => {
        res.render("edit_profileV", {
            layout: "petitionLayout",
            usersRegistration: results
        });
    });
});
//------------------------------
app.post("/edit_profile", (req, res) => {
    if (req.body.password) {
        hashPassword(req.body.password).then(hash => {
            Promise.all([
                updateProfileInUsersWithPass(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hash,
                    req.session.userId
                ),
                updateProfileInUserProfiles(
                    req.body.age,
                    req.body.city,
                    req.body.homepage,
                    req.session.userId
                )
            ])
                .then(function([data1, data2]) {

                    res.redirect("/thankyou");
                })
                .catch(err => {
                    console.log(
                        "couldnt update profile users with pass: ",
                        err
                    );
                    res.render("edit_profileV", {
                        layout: "petitionLayout",
                        error: "error"
                    });
                });
        });
    } else {
        Promise.all([
            updateProfileInUsersNoPass(
                req.body.first,
                req.body.last,
                req.body.email,
                req.session.userId
            ),
            updateProfileInUserProfiles(
                req.body.age,
                req.body.city,
                req.body.homepage,
                req.session.userId
            )
        ])
            .then(function([data1, data2]) {
                res.redirect("/thankyou");
            })
            .catch(err => {
                console.log("couldnt update profile users with NO pass: ", err);
                res.render("edit_profileV", {
                    layout: "petitionLayout",
                    error: "error"
                });
            });
    }
});

//------------------------------
app.get("/petition", requireUserId, requireNoSignature, (req, res) => {
    if (!req.session.sigId) {
        res.render("petitionV", {
            layout: "petitionLayout",
            first: req.session.first,
            last: req.session.last
        });
    } else {
        res.redirect("/thankyou");
    }
});
//-----------------------------
app.post("/petition", requireNoSignature, (req, res) => {
    signing(
        req.session.userId,
        req.body.signature
    )
        .then(sigId => {
            console.log("Results from our query: ", sigId);
            req.session.sigId = sigId;

            res.redirect("/thankyou");
        })
        .catch(err => {
            console.log(err);
            res.render("petitionV", {
                layout: "petitionLayout",
                error: "error"
            });
        });
});
//-----------------------------
app.get("/thankyou", requireUserId, (req, res) => {
    getSignatureById(req.session.sigId)
        .then(userSignature => {
            res.render("thankyouV", {
                layout: "petitionLayout",
                sig: userSignature
            });
        })
        .catch(err => console.log(err));
});
//-----------------------------
app.post("/thankyou", (req, res) => {
    deleteSignature(req.session.userId).then(() => {
        req.session.sigId = null;
        res.redirect("/petition");
    });
});
//-----------------------------
app.get("/signers", requireUserId, requireSignature, (req, res) => {
    signersList()
        .then(resultOfDataBaseQuery => {
            res.render("signerslistV", {
                layout: "petitionLayout",
                signersArray: resultOfDataBaseQuery
            });
        })
        .catch(err => console.log("SignersList error: ", err));
});
//-----------------------------
app.get("/signers/:city", function(req, res) {
    getSignersByCity(req.params.city).then(function(signers) {
        res.render("signers", {
            signers: signers
        });
    });
});
//-----------------------------
app.get("/logout", function(req, res) {
    req.session = null;
    res.redirect("/login");
});
//-----------------------------
app.get("*", function(req, res) {
    res.redirect("/");
});
//-----------------------------
app.listen(process.env.PORT || 8080, () => console.log("listening"));
