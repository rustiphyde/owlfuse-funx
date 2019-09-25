const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./util/fbAuth");

const cors = require("cors");
app.use(cors());

const { db } = require("./util/admin");

const {
  getAllSparks,
  postOneSpark,
  getSpark,
  stokeSpark,
  addSparkHeat,
  removeSparkHeat,
  extinguishSpark
} = require("./handlers/sparks");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  markSizzlesread
} = require("./handlers/users");

// Spark routes
app.get("/sparks", getAllSparks);
app.post("/spark", FBAuth, postOneSpark);
app.post("/spark/:sparkId", getSpark);
app.post("/spark/:sparkId/stoke", FBAuth, stokeSpark);
app.get("/spark/:sparkId/burn", FBAuth, addSparkHeat);
app.get("/spark/:sparkId/snuff", FBAuth, removeSparkHeat);
app.delete("/spark/:sparkId", FBAuth, extinguishSpark);

// User routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.post("/sizzles", FBAuth, markSizzlesRead);
//app.get("/user/:clozang", getUserDetails);

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);

exports.createSizzleOnSparkHeat = functions.firestore
  .document("SparkHeat/{id}")
  .onCreate(snap => {
    return db
      .doc(`/Sparks/${snap.data().sparkId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().alias !== snap.data().alias) {
          return db.doc(`/Sizzles/${snap.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().alias,
            sender: snap.data().alias,
            type: "heat",
            read: false,
            sparkId: doc.id
          });
        }
      })
      .catch(err => console.error(err));
  });

  exports.createSizzleOnSparkStoke = functions.firestore
  .document("SparkStokes/{id}")
  .onCreate(snap => {
    return db
      .doc(`/Sparks/${snap.data().sparkId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().alias !== snap.data().alias) {
          return db.doc(`/Sizzles/${snap.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().alias,
            sender: snap.data().alias,
            type: "stoke",
            read: false,
            sparkId: doc.id
          });
        }
      })
      .catch(err => console.error(err));
  });

  exports.removeSparkHeatSizzle = functions.firestore
  .document("SparkHeat/{id}")
  .onDelete(snap => {
    return db
      .doc(`/Sizzles/${snap.id}`)
      .delete()
      .catch(err => console.error(err));
  });
