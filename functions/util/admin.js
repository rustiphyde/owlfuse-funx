const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://owlfuse-app.firebaseio.com",
    storageBucket: "owlfuse-app.appspot.com"
});

const db = admin.firestore();

module.exports = { admin, db };  