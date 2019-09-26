const { admin, db } = require("../util/admin");
const config = require("../util/config");

const firebase = require("firebase");
firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails
} = require("../util/validators");

// Sign up for an Owlfuse account
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    alias: req.body.alias,
    clozang: ">" + req.body.alias.replace(/\s/g, "-").toLowerCase()
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  const noImg = "No-owlfuse-pic.png";

  let token, userId;
  db.doc(`/Users/${newUser.clozang}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({
          clozang: "This clozang has already been taken by someone else"
        });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        alias: newUser.alias,
        clozang: newUser.clozang,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId
      };
      return db.doc(`/Users/${newUser.clozang}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use" });
      } else {
        return res
          .status(500)
          .json({ general: "Something went wrong, please try again" });
      }
    });
};

//Login to Owlfuse
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const { valid, errors } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      return res
        .status(403)
        .json({ general: "Wrong credentials, please try again" });
    });
};

// Add user details to OwlFuse profile
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/Users/${req.user.clozang}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details added successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Fetch any user's details
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/Users/${req.params.clozang}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.user = doc.data();
        return db
          .collection("Sparks")
          .where("clozang", "==", req.params.clozang)
          .orderBy("createdAt", "desc")
          .get();
      } else {
        return res.status(404).json({ error: "User not found" });
      }
    })
    .then(data => {
      userData.sparks = [];
      data.forEach(doc => {
        userData.sparks.push({
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          alias: doc.data().alias,
          clozang: doc.data().clozang,
          userImage: doc.data().userImage,
          heat: doc.data().heat,
          stokeCount: doc.data().stokeCount,
          sparkId: doc.id
        });
      });
      return db
          .collection("Fires")
          .where("clozang", "==", req.params.clozang)
          .orderBy("heat", "desc")
          .get();
    })
    .then(data => {
      userData.fires = [];
      data.forEach(doc => {
        userData.fires.push({
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          alias: doc.data().alias,
          clozang: doc.data().clozang,
          userImage: doc.data().userImage,
          heat: doc.data().heat,
          stokeCount: doc.data().stokeCount,
          fireId: doc.id
        });
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};


// Get own user details
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/Users/${req.user.clozang}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("SparkHeat")
          .where("alias", "==", req.user.alias)
          .get();
      }
    })
    .then(data => {
      userData.sparkHeat = [];
      data.forEach(doc => {
        userData.sparkHeat.push(doc.data());
      });
      return db
          .collection("FireHeat")
          .where("alias", "==", req.user.alias)
          .get();
    })
    .then(data => {
      userData.fireHeat = [];
      data.forEach(doc => {
        userData.fireHeat.push(doc.data());
      });
      return db
        .collection("SparkSizzles")
        .where("recipient", "==", req.user.alias)
        .orderBy("createdAt", "desc")
        .limit(16)
        .get();
    })
    .then(data => {
      userData.sparkSizzles = [];
      data.forEach(doc => {
        userData.sparkSizzles.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          sparkId: doc.data().sparkId,
          type: doc.data().type,
          read: doc.data().read,
          sizzleId: doc.id
        });
      });
      return db
        .collection("FireSizzles")
        .where("recipient", "==", req.user.alias)
        .orderBy("createdAt", "desc")
        .limit(16)
        .get();
    })
    .then(data => {
      userData.fireSizzles = [];
      data.forEach(doc => {
        userData.fireSizzles.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          fireId: doc.data().fireId,
          type: doc.data().type,
          read: doc.data().read,
          sizzleId: doc.id
        });
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Upload a profile image to Owlfuse
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 10000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    const buckethead = admin.storage().bucket();

    buckethead
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/Users/${req.user.clozang}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Image uploaded successfully" });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};

exports.markSparkSizzlesRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach(sizzleId => {
    const sizzle = db.doc(`/SparkSizzles/${sizzleId}`);
    batch.update(sizzle, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: "Sizzles marked read" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.resetPassword = (req, res) => {
  const resUser = {
    email: req.body.email
  };

  const { valid, errors } = validateResetData(resUser);

  if (!valid) {
    return res.status(400).json(errors);
  } else {
    firebase
      .auth()
      .sendPasswordResetEmail(resUser.email)
      .then(() => {
        return res.status(201).json({
          message:
            "Your password reset email has been sent to the email address you provided"
        });
      })
      .catch(err => {
        if (err.code === "auth/user-not-found") {
          return res.status(404).json({
            reset: "The email you entered doesn\'t match any in our database"
          });
        } else {
          return res.status(500).json({ error: err.code });
        }
      });
  }
};