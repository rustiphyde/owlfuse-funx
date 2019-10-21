const { db } = require("../util/admin");

exports.getAllInfernals = (req, res) => {
  db.collection("Infernals")
    .orderBy("heatCount", "desc")
    .get()
    .then(data => {
      let infernals = [];
      data.forEach(doc => {
        infernals.push({
          infernalId: doc.id,
          body: doc.data().body,
          userAlias: doc.data().userAlias,
          userClozang: doc.data().userClozang,
          createdAt: doc.data().createdAt,
          stokeCount: doc.data().stokeCount,
          heatCount: doc.data().heatCount,
          userImage: doc.data().userImage,
          emberCount: doc.data().emberCount
        });
      });
      return res.json(infernals);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

