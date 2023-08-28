const jwt = require("jsonwebtoken");
const userdb = require("../models/userScema");
const keysecret = process.env.SECRET_KEY


const adminauth = async(req,res,next)=>{
    try {
        const admintoken = req.headers.authorization;
        if (!admintoken) {
            return res.status(401).json({ status: 401, message: "Unauthorized, no token provided" });
        }

        const verifytoken = jwt.verify(admintoken, keysecret);
        const rootUser = await userdb.findOne({ _id: verifytoken._id });
        if (!rootUser) {
            alert("Invalid Details")
            throw new Error("User not found");
        }

        if (rootUser.role !== "admin") {
            alert("Invalid Details")
            return res.status(403).json({ status: 403, message: "Access denied. Admin role required." });
        }

        req.token = admintoken;
        req.rootUser = rootUser;
        req.userId = rootUser._id;
        next();
    } catch (error) {
        res.status(401).json({ status: 401, message: "Unauthorized, invalid token" });
    }
}


module.exports = adminauth