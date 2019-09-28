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
  addHeat,
  removeHeat,
  extinguishSpark
} = require("./handlers/sparks");

const {
  buildNewOkeList,
  getAllOkelists,
  getOke,
  addOneSong,
  getSongsByList,
  getSongsByArtist,
  getSongsByClozang,
  choozByList,
  choozByArtist,
  choozByClozang,
  choozFromAllSongs,
  eraseOkeList
} = require('./handlers/okelists');

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
app.get("/spark/:sparkId", getSpark);
app.post("/spark/:sparkId/stoke", FBAuth, stokeSpark);
app.get("/spark/:sparkId/burn", FBAuth, addHeat);
app.get("/spark/:sparkId/snuff", FBAuth, removeHeat);
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

// Oke routes
app.post("/okelist", FBAuth, buildNewOkeList);
app.get("/okelists", getAllOkeLists);
app.get("/okelist/:okeId", getOke);
app.post("/okelist/:okeId/song", FBAuth, addOneSong);
app.get("/songs/:okeId/list", getSongsByList);
app.get("/songs/:artist/artist", getSongsByArtist);
app.get("/songs/:clozang/clozang", getSongsByClozang);
app.get("/song/:okeId/list/chooz", choozByList);
app.get("/song/:artist/artist/chooz", choozByArtist);
app.get("/song/:clozang/clozang/chooz", choozByClozang);
app.get("/song/all/chooz", choozFromAllSongs);
app.delete("/okelist/:okeId", FBAuth, eraseOkelist);

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);

exports.createSizzleOnHeat = functions.firestore
  .document("Heat/{id}")
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

exports.createSizzleOnStoke = functions.firestore
  .document("Stokes/{id}")
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

exports.removeHeatSizzle = functions.firestore
  .document("Heat/{id}")
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
            .collection("Stokes")
            .where("clozang", "==", change.before.data().clozang)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const spark = db.doc(`/Stokes/${doc.id}`);
            batch.update(spark, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onSparkExtinguish = functions.firestore
  .document("/Sparks/{sparkId}")
  .onDelete((snap, context) => {
    const sparkId = context.params.sparkId;
    const batch = db.batch();
    return db
      .collection("Stokes")
      .where("sparkId", "==", sparkId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/Stokes/${doc.id}`));
        });
        return db
          .collection("/Heat")
          .where("sparkId", "==", sparkId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/Heat/${doc.id}`));
        });
        return db
          .collection("/Sizzles")
          .where("sparkId", "==", sparkId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/Sizzles/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.error(err));
  });

exports.sparkToFire = functions.firestore
  .document("/Sparks/{sparkId}")
  .onUpdate(change => {
    if (
      change.before.data().heatCount !== change.after.data().heatCount &&
      change.after.data().heatCount > 99 && change.before.data().fire === false
    ) {      
      return db
        .doc(`/Sparks/${change.before.id}`)
        .get()
        .then(doc => {
          doc.ref.update({ 'fire': true })
            })
        .catch(err => console.error(err));
    } else return;
  });

  exports.snuffOutFire = functions.firestore
  .document("/Sparks/{id}")
  .onUpdate(change => {
    if (
      change.before.data().heatCount !== change.after.data().heatCount &&
      change.after.data().heatCount < 1 && change.before.data().fire === true
    ) {
      return db
        .doc(`/Sparks/${change.before.id}`)
        .delete()
        .catch(err => console.log(err));
    } else return;
  });

  exports.onAliasChange = functions.firestore
  .document("/Users/{id}")
  .onUpdate(change => {
    if (change.before.data().alias !== change.after.data().alias) {
      const batch = db.batch();
      return db
        .collection("Users")
        .where("clozang", "==", change.before.data().clozang)
        .get()
        .then(data => {
          data.forEach(doc => {
            const newAlias = db.doc(`/Users/${change.before.data().clozang}`);
            batch.update(newAlias, { alias: change.after.data().alias });
          });
          return db
            .collection("Sparks")
            .where("alias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newSparkAlias = db.doc(`/Sparks/${doc.id}`);
            batch.update(newSparkAlias, {
              alias: change.after.data().alias
            });
          });
          return db
            .collection("Stokes")
            .where("alias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newStokeAlias = db.doc(`Stokes/${doc.id}`);
            batch.update(newStokeAlias, {
              alias: change.after.data().alias
            });
          });
          return db
            .collection("Heat")
            .where("alias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newHeatAlias = db.doc(`Heat/${doc.id}`);
            batch.update(newHeatAlias, {
              alias: change.after.data().alias
            });
          });
          return db
            .collection("Boozulas")
            .where("alias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newBoozulaAlias = db.doc(`Boozulas/${doc.id}`);
            batch.update(newBoozulaAlias, {
              alias: change.after.data().alias
            });
          });
          return db
            .collection("Sizzles")
            .where("sender", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newSenderAlias = db.doc(`Sizzles/${doc.id}`);
            batch.update(newSenderAlias, {
              sender: change.after.data().alias
            });
          });
          return db
            .collection("Sizzles")
            .where("recipient", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newRecipientAlias = db.doc(`Sizzles/${doc.id}`);
            batch.update(newRecipientAlias, {
              recipient: change.after.data().alias
            });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onOkelistErase = functions.firestore
  .document("Okelists/{id}")
  .onDelete(snap => {
    return db
      .doc(`/Songs/${snap.data().okeId}`)
      .delete()
      .catch(err => console.error(err));
  });