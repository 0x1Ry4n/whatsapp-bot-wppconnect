module.exports = function (req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            msg: "Authorization token wasn't provided"
        })
    }

    if (token !== process.env.SECRET_TOKEN) {
        return res.status(401).json({
            msg: "Invalid Authorization token"
        })
    }

    next()
}