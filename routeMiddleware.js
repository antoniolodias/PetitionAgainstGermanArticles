exports.requireNoSignature = function(req, res, next) {
    if (req.session.sigId) {
        return res.redirect("/thankyou");
    } else {
        next();
    }
};

exports.requireSignature = function(req, res, next) {
    if (!req.session.sigId) {
        return res.redirect("/petition");
    } else {
        next();
    }
};

exports.requireUserId = function(req, res, next) {
    if (!req.session.userId) {

        res.redirect("/registration");
    } else {
        next();
    }
};

exports.requireLoggedOut = function(req, res, next) {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
};
