const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

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

exports.createSpark = functions.https.onRequest((req, res) => {
    const newSpark = {
        body: req.body.body,
        userCandle: req.body.userCandle,
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