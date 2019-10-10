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
  getSongsByAlias,
  choozByList,
  choozByArtist,
  choozByAlias,
  choozFromAllSongs,
  eraseOkelist
} = require('./handlers/okelists');

const {
  buildNewBoozula,
  uploadBoozImage,
  getAllBoozulas,
  getBoozula,
  addCheers,
  removeCheers,
  toastBoozula,
  addBoozDetails,
  emptyBoozula
} = require('./handlers/boozulas');

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markSizzlesRead,
  markClinksRead,
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
app.post("/clinks", FBAuth, markClinksRead);
app.get("/user/:clozang", getUserDetails);
app.post("/reset", resetPassword);

// Oke routes
app.post("/okelist", FBAuth, buildNewOkeList);
app.get("/okelists", getAllOkelists);
app.get("/okelist/:okeId", getOke);
app.post("/okelist/:okeId/song", FBAuth, addOneSong);
app.get("/songs/:okeId/list", getSongsByList);
app.get("/songs/:artist/artist", getSongsByArtist);
app.get("/songs/:alias/alias", getSongsByAlias);
app.get("/song/:okeId/list/chooz", choozByList);
app.get("/song/:artist/artist/chooz", choozByArtist);
app.get("/song/:alias/alias/chooz", choozByAlias);
app.get("/song/all/chooz", choozFromAllSongs);
app.delete("/okelist/:okeId", FBAuth, eraseOkelist);

// Boozula Routes
app.post("/boozula", FBAuth, buildNewBoozula);
app.post("/boozula/:boozId/image", FBAuth, uploadBoozImage);
app.get("/boozulas", getAllBoozulas);
app.get("/boozula/:boozId", getBoozula);
app.get("/boozula/:boozId/cheers", FBAuth, addCheers);
app.get("/boozula/:boozId/unCheers", FBAuth, removeCheers);
app.post("/boozula/:boozId/toast", FBAuth, toastBoozula);
app.post("/boozula/:boozId/add", FBAuth, addBoozDetails);
app.delete("/boozula/:boozId", FBAuth, emptyBoozula);

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);

exports.createSizzleOnHeat = functions.firestore
  .document("Heat/{id}")
  .onCreate(snap => {
    return db
      .doc(`/Sparks/${snap.data().sparkId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().userAlias !== snap.data().userAlias) {
          return db.doc(`/Sizzles/${snap.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userAlias,
            sender: snap.data().userAlias,
            type: "heat",
            read: false,
            sparkId: doc.id,
            sizzleId: snap.id
          });
        }
      })
      .catch(err => console.error(err));
  });

  exports.createClinkOnCheers = functions.firestore
  .document("Cheers/{id}")
  .onCreate(snap => {
    return db
      .doc(`/Boozulas/${snap.data().boozId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().userAlias !== snap.data().userAlias) {
          return db.doc(`/Clinks/${snap.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userAlias,
            sender: snap.data().userAlias,
            type: "cheers",
            read: false,
            boozId: doc.id,
            clinkId: snap.id
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
        if (doc.exists && doc.data().userAlias !== snap.data().userAlias) {
          return db.doc(`/Sizzles/${snap.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userAlias,
            sender: snap.data().userAlias,
            type: "stoke",
            read: false,
            sparkId: doc.id,
            sizzleId: snap.id
          });
        }
      })
      .catch(err => console.error(err));
  });

  exports.createClinkOnToast = functions.firestore
  .document("Toasts/{id}")
  .onCreate(snap => {
    return db
      .doc(`/Boozulas/${snap.data().boozId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().userAlias !== snap.data().userAlias) {
          return db.doc(`/Clinks/${snap.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userAlias,
            sender: snap.data().userAlias,
            type: "toast",
            read: false,
            boozId: doc.id,
            clinkId: snap.id
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

  exports.removeCheersClink = functions.firestore
  .document("Cheers/{id}")
  .onDelete(snap => {
    return db
      .doc(`/Clinks/${snap.id}`)
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
        .where("userAlias", "==", change.before.data().alias)
        .get()
        .then(data => {
          data.forEach(doc => {
            const spark = db.doc(`/Sparks/${doc.id}`);
            batch.update(spark, { userImage: change.after.data().imageUrl });
          });
          return db
            .collection("Stokes")
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const stoke = db.doc(`/Stokes/${doc.id}`);
            batch.update(stoke, { userImage: change.after.data().imageUrl });
          });
          return db
            .collection("Toasts")
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const toast = db.doc(`/Toasts/${doc.id}`);
            batch.update(toast, { userImage: change.after.data().imageUrl });
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
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newSparkAlias = db.doc(`/Sparks/${doc.id}`);
            batch.update(newSparkAlias, {
              userAlias: change.after.data().alias
            });
          });
          return db
            .collection("Stokes")
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newStokeAlias = db.doc(`/Stokes/${doc.id}`);
            batch.update(newStokeAlias, {
              userAlias: change.after.data().alias
            });
          });
          return db
            .collection("Toasts")
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newToastAlias = db.doc(`/Toasts/${doc.id}`);
            batch.update(newToastAlias, {
              userAlias: change.after.data().alias
            });
          });
          return db
          .collection("Songs")
          .where("userAlias", "==", change.before.data().alias)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          const newSongAlias = db.doc(`/Songs/${doc.id}`);
          batch.update(newSongAlias, {
            userAlias: change.after.data().alias
          });
        });
          return db
            .collection("Heat")
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newHeatAlias = db.doc(`/Heat/${doc.id}`);
            batch.update(newHeatAlias, {
              userAlias: change.after.data().alias
            });
          });
          return db
            .collection("Cheers")
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newCheersAlias = db.doc(`/Cheers/${doc.id}`);
            batch.update(newCheersAlias, {
              userAlias: change.after.data().alias
            });
          });
          return db
            .collection("Boozulas")
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newBoozulaAlias = db.doc(`/Boozulas/${doc.id}`);
            batch.update(newBoozulaAlias, {
              userAlias: change.after.data().alias
            });
          });
          return db
            .collection("Okelists")
            .where("userAlias", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newOkelistAlias = db.doc(`/Okelists/${doc.id}`);
            batch.update(newOkelistAlias, {
              userAlias: change.after.data().alias
            });
          });
          return db
            .collection("Sizzles")
            .where("sender", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newSenderAlias = db.doc(`/Sizzles/${doc.id}`);
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
            const newRecipientAlias = db.doc(`/Sizzles/${doc.id}`);
            batch.update(newRecipientAlias, {
              recipient: change.after.data().alias
            });
          });
          return db
            .collection("Clinks")
            .where("sender", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newSenderAlias = db.doc(`/Clinks/${doc.id}`);
            batch.update(newSenderAlias, {
              sender: change.after.data().alias
            });
          });
          return db
            .collection("Clinks")
            .where("recipient", "==", change.before.data().alias)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const newRecipientAlias = db.doc(`/Clinks/${doc.id}`);
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

  exports.onBoozulaEmpty = functions.firestore
  .document("/Boozulas/{boozId}")
  .onDelete((snap, context) => {
    const boozId = context.params.boozId;
    const batch = db.batch();
    return db
      .collection("Toasts")
      .where("boozId", "==", boozId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/Toasts/${doc.id}`));
        });
        return db
          .collection("/Cheers")
          .where("boozId", "==", boozId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/Cheers/${doc.id}`));
        });
        return db
          .collection("/Clinks")
          .where("boozId", "==", boozId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/Clinks/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.error(err));
  });