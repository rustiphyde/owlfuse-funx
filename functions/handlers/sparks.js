const { db } = require('../util/admin');

exports.getAllSparks =  (req, res) => {
    db
        .collection('Sparks')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let sparks = []
            data.forEach(doc => {
                sparks.push({
                    sparkId: doc.id,
                    body: doc.data().body,
                    clozang: doc.data().clozang,
                    createdAt: doc.data().createdAt,
                    stokeCount: doc.data().stokeCount,
                    burnCount: doc.data().burnCount,
                    userImage: doc.data().userImage
                });
            });
            return res.json(sparks);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code});
        });
};

exports.postOneSpark = (req, res) => {
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
  }; 