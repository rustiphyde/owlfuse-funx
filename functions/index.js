const functions = require("firebase-functions");
const admin = require("firebase-admin");
const config = require("./util/config");

admin.initializeApp();

const express = require("express");
const app = express();

const firebase = require("firebase");
firebase.initializeApp(config);

db = admin.firestore();

// Function to fetch data from Firebase Firestore
app.get("/sparks", (req, res) => {
  admin;
  db.collection("Sparks")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let sparks = [];
      data.forEach(doc => {
        sparks.push({
          sparkId: doc.id,
          body: doc.data().body,
          clozang: doc.data().clozang,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(sparks);
    })
    .catch(err => console.error(err));
});

const FBAuth = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return res.status(403).json({ error: "Unauthorized action" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      return db
        .collection("Users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.clozang = data.docs[0].data().clozang;
      return next();
    })
    .catch(err => {
      console.error("Error while verifying token", err);
      return res.status(403).json(err);
    });
};

// Function to persist data to Firebase Firestore
app.post("/spark", FBAuth, (req, res) => {
  const newSpark = {
    body: req.body.body,
    clozang: req.user.clozang,
    createdAt: new Date().toISOString()
  };

  db.collection("Sparks")
    .add(newSpark)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

const isEmail = email => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};

// Sign Up Route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    alias: req.body.alias,
    clozang: ">" + req.body.alias.replace(/\s/g, "-").toLowerCase()
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Field must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) {
    errors.password = "Field must not be empty";
  }

  if (newUser.confirmPassword !== newUser.password) {
    errors.confirmPassword = "Password fields must match";
  }

  if (isEmpty(newUser.alias)) {
    errors.alias = "Field must not be empty";
  }

  if (Object.keys(errors).length > 0) {
    return status(400).json(errors);
  }

  let token, userId;

  db.doc(`/Users/${newUser.clozang}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ clozang: "This Clozang is already taken." });
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
        clozang: newUser.clozang,
        email: newUser.email,
        createdAt: new Date().toISOString(),
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
});

app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  let errors = {};

  if (isEmpty(user.email)) {
    errors.email = "Field must not be empty";
  }
  if (isEmpty(user.password)) {
    errors.password = "Field must not be empty";
  }
  if (Object.keys(errors).length > 0) {
    return status(400).json(errors);
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "Wrong credentials, please try again" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);
