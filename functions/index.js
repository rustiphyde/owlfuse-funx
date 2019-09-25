const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./util/fbAuth");

const cors = require("cors");
app.use(cors());

const { db } = require("./util/admin");

const { getAllSparks, postOneSpark } = require("./handlers/sparks");
const { signup, login, uploadImage } = require("./handlers/users");

// Spark routes
app.get("/sparks", getAllSparks);
app.post("/spark", FBAuth, postOneSpark);
// User routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);


// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);