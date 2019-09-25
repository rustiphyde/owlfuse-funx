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
        .firestore().collection('Sparks')
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

    admin.firestore()
    .collection('Sparks')
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
        return data.user.getIdToken();
      })
      .then(token => {
        return res.status(201).json({ token });
      })
      .catch(err=> {
          console.error(err);
          return res.status(500).json({ error: err.code });
      })
  });

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);