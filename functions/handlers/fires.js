const { db } = require("../util/admin");

exports.getAllFires = (req, res) => {
  db.collection("Fires")
    .orderBy("heat", "desc")
    .get()
    .then(data => {
      let fires = [];
      data.forEach(doc => {
        fires.push({
          fireId: doc.id,
          body: doc.data().body,
          alias: doc.data().alias,
          clozang: doc.data().clozang,
          createdAt: doc.data().createdAt,
          stokeCount: doc.data().stokeCount,
          heat: doc.data().heat,
          userImage: doc.data().userImage,
          sparkId: doc.data().sparkId,
          email: doc.data().email
        });
      });
      return res.json(fires);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};