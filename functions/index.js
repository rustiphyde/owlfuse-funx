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
  getUserDetails,
  markSizzlesRead,
  resetPassword
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
app.get("/user/:clozang", getUserDetails);
app.post("/reset", resetPassword);

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

  exports.onUserImageChange = functions.firestore
  .document("/Users/{Id}")
  .onUpdate(change => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection("Sparks")
        .where("clozang", "==", change.before.data().clozang)
        .get()
        .then(data => {
          data.forEach(doc => {
            const spark = db.doc(`/Sparks/${doc.id}`);
            batch.update(spark, { userImage: change.after.data().imageUrl });
          });
          return db
            .collection("SparkStokes")
            .where("clozang", "==", change.before.data().clozang)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const spark = db.doc(`/SparkStokes/${doc.id}`);
            batch.update(spark, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

  exports.onSparkExtinguish = functions.firestore.document('/Sparks/{sparkId}')
.onDelete((snap, context) => {
    const sparkId = context.params.sparkId;
    const batch = db.batch();
    return db.collection('SparkStokes')
    .where('sparkId', '==', sparkId).get()
        .then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/SparkStokes/${doc.id}`));
            })
            return db.collection('/SparkHeat').where('sparkId', '==', sparkId).get();
        })
        .then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/SparkHeat/${doc.id}`));
            })
            return db.collection('/Sizzles').where('sparkId', '==', sparkId).get();
        })
        .then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/Sizzles/${doc.id}`));
            })
            return batch.commit();
        })
        .catch(err => console.error(err));
});

exports.sparkToFire = functions.firestore
  .document("/Sparks/{sparkId}")
  .onUpdate(change => {
    if (
      change.before.data().heat !== change.after.data().heat &&
      change.after.data().heat > 99
    ) {
      return db
        .doc(`/Sparks/${change.before.id}`)
        .get()
        .then(doc => {
          const newFire = {
            sparkId: doc.id,
            body: doc.data().body,
            alias: doc.data().alias,
            clozang: doc.data().clozang,
            createdAt: doc.data().createdAt,
            heat: doc.data().stokeCount + doc.data().heat,
            stokeCount: doc.data().stokeCount,
            userImage: doc.data().userImage,
            email: doc.data().email
          };
          return db
            .collection("Fires")
            .doc(change.before.id)
            .set(newFire)
            .then(doc => {
            const resFire = newFire;
            resFire.fireId = doc.id;
            });

        })
        .catch(err => console.error(err));
    } else return;
  });