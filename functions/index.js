const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = require("./util/config");

admin.initializeApp();

const express = require('express');
const app = express();

const firebase = require("firebase");
firebase.initializeApp(config);

db = admin.firestore();

// Function to fetch data from Firebase Firestore
app.get('/sparks', (req, res) => {
    admin
        db.collection('Sparks')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let sparks = [];
            data.forEach((doc) => {
                sparks.push({
                    sparkId: doc.id,
                    body: doc.data().body,
                    clozang: doc.data().clozang,
                    createdAt: doc.data().createdAt
                });
            });
            return res.json(sparks);
        })
        .catch((err) => console.error(err));
})

// Function to persist data to Firebase Firestore
app.post('/spark', (req, res) => {

    const newSpark = {
        body: req.body.body,
        clozang: req.body.clozang,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };

    db.collection('Sparks')
    .add(newSpark)
    .then((doc) => {
        res.json({ message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
        res.status(500).json({ error: 'something went wrong'});
        console.error(err);
    });
});

// Sign Up Route
app.post("/signup", (req, res) => {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      alias: req.body.alias,
      clozang: ">" + req.body.alias.replace(/\s/g, "-").toLowerCase()
    };
  
    // TODO validate data
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
        return db.doc(`/Users/${newUser.candle}`).set(userCredentials);
      })
      .then(() => {
        return res.status(201).json({ token });
      })
      .catch(err => {
        console.error(err);
        if (err.code === "auth/email-already-in-use") {
          return res.status(400).json({ email: "Email is already in use" });
        } else {
          return res.status(500).json({ general: "Something went wrong, please try again" });
        }
      });
  });

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);