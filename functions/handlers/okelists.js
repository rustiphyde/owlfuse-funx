const { db } = require("../util/admin");

// Build New Oke List
exports.buildNewOkeList = (req, res) => {
  if (req.body.listName.trim() === "")
    return res.status(400).json({ okeList: "Field must not be empty" });
  if (req.body.description.trim() === "")
    return res.status(400).json({ description: "Field must not be empty" });

  const newOkeList = {
    listName: req.body.listName,
    description: req.body.description,
    clozang: req.user.clozang,
    createdAt: new Date().toISOString(),
    songCount: 0
  };

  db.collection("OkeLists")
    .add(newOkeList)
    .then(doc => {
      const resOke = newOkeList;
      resOke.okeId = doc.id;
      res.json(resOke);
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};

exports.getAllOkeLists = (req, res) => {
  db.collection("OkeLists")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let okes = [];
      data.forEach(doc => {
        okes.push({
          okeId: doc.id,
          createdAt: doc.data().createdAt,
          listName: doc.data().listName,
          description: doc.data().description,
          clozang: doc.data().clozang,
          songCount: doc.data().songCount
        });
      });
      return res.json(okes);
    })
    .catch(err => console.log(err));
};

exports.getOke = (req, res) => {
  let okeData = {};
  db.doc(`OkeLists/${req.params.okeId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "OkeList not found" });
      }
      okeData = doc.data();
      okeData.okeId = doc.id;
      return db
        .collection("Songs")
        .where('okeId', '==', req.params.okeId)
        .get();
    })
    .then(data => {
      okeData.songs = [];
      data.forEach(doc => {
        okeData.songs.push(doc.data());
      });
      return res.json(okeData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

