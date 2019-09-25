const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

// Function to fetch data from Firebase Firestore
app.get('/sparks', (req, res) => {
    admin
        .firestore().collection('Sparks').get()
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

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);