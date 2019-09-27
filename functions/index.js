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
  getAllFires,
  getFire,
  stokeFire,
  addFireHeat,
  removeFireHeat,
  extinguishFire
} = require("./handlers/fires");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markSparkSizzlesRead,
  resetPassword
} = require("./handlers/users");

// Spark routes
app.get("/sparks", getAllSparks);
app.post("/spark", FBAuth, postOneSpark);
app.get("/spark/:sparkId", getSpark);
app.post("/spark/:sparkId/stoke", FBAuth, stokeSpark);
app.get("/spark/:sparkId/burn", FBAuth, addSparkHeat);
app.get("/spark/:sparkId/snuff", FBAuth, removeSparkHeat);
app.delete("/spark/:sparkId", FBAuth, extinguishSpark);

// Fire Routes
app.get("/fires", getAllFires);
app.get("/fire/:fireId", getFire);
app.post("/fire/:fireId/stoke", FBAuth, stokeFire);
app.get("/fire/:fireId/burn", FBAuth, addFireHeat);
app.get("/fire/:fireId/snuff", FBAuth, removeFireHeat);
app.delete("/fire/:fireId", FBAuth, extinguishFire);

// User routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.post("/sizzles", FBAuth, markSparkSizzlesRead);
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
          return db.doc(`/SparkSizzles/${snap.id}`).set({
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

  exports.createSizzleOnFireHeat = functions.firestore
  .document("FireHeat/{id}")
  .onCreate(snap => {
    return db
      .doc(`/Fires/${snap.data().fireId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().alias !== snap.data().alias) {
          return db.doc(`/FireSizzles/${snap.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().alias,
            sender: snap.data().alias,
            type: "heat",
            read: false,
            fireId: doc.id
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
          return db.doc(`/SparkSizzles/${snap.id}`).set({
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

  exports.createSizzleOnFireStoke = functions.firestore
  .document("FireStokes/{id}")
  .onCreate(snap => {
    return db
      .doc(`/Fires/${snap.data().fireId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().alias !== snap.data().alias) {
          return db.doc(`/FireSizzles/${snap.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().alias,
            sender: snap.data().alias,
            type: "stoke",
            read: false,
            fireId: doc.id
          });
        }
      })
      .catch(err => console.error(err));
  });

exports.removeSparkHeatSizzle = functions.firestore
  .document("SparkHeat/{id}")
  .onDelete(snap => {
    return db
      .doc(`/SparkSizzles/${snap.id}`)
      .delete()
      .catch(err => console.error(err));
  });

  exports.removeFireHeatSizzle = functions.firestore
  .document("FireHeat/{id}")
  .onDelete(snap => {
    return db
      .doc(`/FireSizzles/${snap.id}`)
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
            .collection("Fires")
            .where("clozang", "==", change.before.data().clozang)
            .get();
        })
        .then(data => {
          data.forEach(doc => {
            const fire = db.doc(`/Fires/${doc.id}`);
            batch.update(fire, { userImage: change.after.data().imageUrl });
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

exports.onSparkExtinguish = functions.firestore
  .document("/Sparks/{sparkId}")
  .onDelete((snap, context) => {
    const sparkId = context.params.sparkId;
    const batch = db.batch();
    return db
      .collection("SparkStokes")
      .where("sparkId", "==", sparkId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/SparkStokes/${doc.id}`));
        });
        return db
          .collection("/SparkHeat")
          .where("sparkId", "==", sparkId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/SparkHeat/${doc.id}`));
        });
        return db
          .collection("/SparkSizzles")
          .where("sparkId", "==", sparkId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/SparkSizzles/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.error(err));
  });

  exports.onFireExtinguish = functions.firestore
  .document("/Fires/{fireId}")
  .onDelete((snap, context) => {
    const fireId = context.params.fireId;
    const batch = db.batch();
    return db
      .collection("FireStokes")
      .where("fireId", "==", fireId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/FireStokes/${doc.id}`));
        });
        return db
          .collection("/FireHeat")
          .where("fireId", "==", fireId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/FireHeat/${doc.id}`));
        });
        return db
          .collection("/FireSizzles")
          .where("fireId", "==", fireId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/FireSizzles/${doc.id}`));
        });
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

exports.moveStokesToFire = functions.firestore
  .document("/Sparks/{sparkId}")
  .onUpdate(change => {
    if (
      change.before.data().heat !== change.after.data().heat &&
      change.after.data().heat > 99
    ) {
      return db
        .collection("SparkStokes")
        .where("sparkId", "==", change.before.id)
        .get()
        .then(data => {
          data.forEach(doc => {
            return db.collection("FireStokes").add({
              fireId: doc.data().sparkId,
              clozang: doc.data().clozang,
              body: doc.data().body,
              alias: doc.data().alias,
              createdAt: doc.data().createdAt,
              userImage: doc.data().userImage
            });
          });
        })
        .catch(err => console.error(err));
    } else return;
  });

  exports.moveHeatToFire = functions.firestore
  .document("/Sparks/{sparkId}")
  .onUpdate(change => {
    if (
      change.before.data().heat !== change.after.data().heat &&
      change.after.data().heat > 99
    ) {
      return db
        .collection("SparkHeat")
        .where("sparkId", "==", change.before.id)
        .get()
        .then(data => {
          data.forEach(doc => {
            return db.collection("FireHeat").add({
              fireId: doc.data().sparkId,
              alias: doc.data().alias
            });
          });
        })
        .catch(err => console.error(err));
    } else return;
  });

  exports.switchToFire = functions.firestore
  .document("/Fires/{id}")
  .onCreate(snap => {
    return db
      .doc(`/Sparks/${snap.data().sparkId}`)
      .delete()
      .catch(err => console.log(err));
  });

  exports.snuffOutFire = functions.firestore
  .document("/Fires/{fireId}")
  .onUpdate(change => {
    if (
      change.before.data().heat !== change.after.data().heat &&
      change.after.data().heat < 1
    ) {
      return db
        .doc(`/Fires/${change.before.id}`)
        .delete()
        .catch(err => console.log(err));
    } else return;
  });

  