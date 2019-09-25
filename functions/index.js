const functions = require("firebase-functions");

admin.initializeApp();

const app = require("express")();

const FBAuth = require("./util/fbAuth")

const cors = require('cors');
app.use(cors());

const { db } = require('./util/admin');

const { getAllSparks, postOneSpark } = require("./handlers/sparks");
const { login, signup } = require("./handlers/users");

// Spark Routes
app.get("/sparks", getAllSparks);
app.post("/spark", FBAuth, postOneSpark);

// User Routes
app.post("/signup", signup);
app.post("/login", login);

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);