const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Functionality to fetch data from Firebase Firestore
exports.getSparks = functions.https.onRequest((req, res) => {
    admin
    .firestore().collection('Sparks').get()
	        .then((data) => {
            let sparks = [];
            data.forEach((doc) => {
                sparks.push(doc.data());
            });
            return res.json(sparks);
        })
        .catch((err) => console.error(err));
});

// Functionality to persist data to Firebase Firestore
exports.createSpark = functions.https.onRequest((req, res) => {
    
    if(req.method !== 'POST'){
        return res.status(400).json({ error: 'Method not allowed'})
    }
    
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