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

// Fetch one infernal
exports.getInfernal = (req, res) => {
  let infernalData = {};
  db.doc(`/Infernals/${req.params.infernalId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Infernal not found" });
      }
      infernalData = doc.data();
      infernalData.infernalId = doc.id;
      return db
        .collection("InfernalStokes")
        .where("infernalId", "==", req.params.infernalId)
        .orderBy("createdAt", "desc")
        .get();
    })
    .then(data => {
      infernalData.infernalStokes = [];
      data.forEach(doc => {
        infernalData.infernalStokes.push(doc.data());
      });
      return res.json(infernalData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Comment on a n infernal
exports.stokeInfernal = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ infernalStoke: "Field must not be empty" });
  const newStoke = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    infernalId: req.params.infernalId,
    userAlias: req.user.alias,
    userClozang: req.user.clozang,
    userImage: req.user.imageUrl
  };
  db.doc(`/Infernals/${req.params.infernalId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Infernal has been extinguished" });
      }
      else {
        return doc.ref.update({
          stokeCount: doc.data().stokeCount + 1,
          heatCount: doc.data().heatCount + 1 });
      }
      })
    .then(() => {
      return db.collection("InfernalStokes").add(newStoke);
    })
    .then(() => {
      res.json(newStoke);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};

