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

exports.addOneSong = (req, res) => {
  if (req.body.songTitle.trim() === "")
    return res.status(400).json({ songTitle: "Field must not be empty" });
  if (req.body.songArtist.trim() === "")
    return res.status(400).json({ songArtist: "Field must not be empty" });

  const newSong = {
    clozang: req.user.clozang,
    songTitle: req.body.songTitle,
    songArtist: req.body.songArtist,
    okeId: req.params.okeId,
    artist: req.body.songArtist.replace(/\s/g, "").toLowerCase()
  };

  db.doc(`/OkeLists/${req.params.okeId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "OkeList does not exist" });
      }
      return doc.ref.update({ songCount: doc.data().songCount + 1 });
    })
    .then(() => {
      return db.collection("Songs").add(newSong);
    })
    .then(() => {
      res.json(newSong);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    });
};

exports.getSongsByList = (req, res) => {
  db.collection("Songs")
    .where("okeId", "==", req.params.okeId)
    .get()
    .then(data => {
      let listSongs = [];
      data.forEach(doc => {
        listSongs.push({
          songId: doc.id,
          clozang: doc.data().clozang,
          songTitle: doc.data().songTitle,
          songArtist: doc.data().songArtist,
          okeId: doc.data().okeId
        });
      });
      return res.json(listSongs);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

