const { db } = require("../util/admin");

exports.getAllSparks = (req, res) => {
  db.collection("Sparks")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let sparks = [];
      data.forEach(doc => {
        sparks.push({
          sparkId: doc.id,
          body: doc.data().body,
          alias: doc.data().alias,
          clozang: doc.data().clozang,
          createdAt: doc.data().createdAt,
          stokeCount: doc.data().stokeCount,
          heat: doc.data().heat,
          userImage: doc.data().userImage
        });
      });
      return res.json(sparks);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Fetch one spark
exports.getSpark = (req, res) => {
  let sparkData = {};
  db.doc(`/Sparks/${req.params.sparkId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Spark not found" });
      }
      sparkData = doc.data();
      sparkData.sparkId = doc.id;
      return db
        .collection("SparkStokes")
        .where("sparkId", "==", req.params.sparkId)
        .get();
    })
    .then(data => {
      sparkData.stokes = [];
      data.forEach(doc => {
        sparkData.stokes.push(doc.data());
      });
      return res.json(sparkData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postOneSpark = (req, res) => {
  const newSpark = {
    body: req.body.body,
    alias: req.user.alias,
    clozang: req.user.clozang,
    createdAt: new Date().toISOString(),
    heat: 0,
    stokeCount: 0,
    userImage: req.user.imageUrl
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

// Comment on a spark
exports.stokeSpark = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ stoke: "Field must not be empty" });
  const newStoke = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    sparkId: req.params.sparkId,
    alias: req.user.alias,
    clozang: req.user.clozang,
    userImage: req.user.imageUrl
  };
  db.doc(`/Sparks/${req.params.sparkId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Spark has been extinguished" });
      }
      return doc.ref.update({ stokeCount: doc.data().stokeCount + 1 });
    })
    .then(() => {
      return db.collection("Stokes").add(newStoke);
    })
    .then(() => {
      res.json(newStoke);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};

// Add Heat to spark
exports.addSparkHeat = (req, res) => {
  const heatDoc = db
    .collection("SparkHeat")
    .where("alias", "==", req.user.alias)
    .where("sparkId", "==", req.params.sparkId)
    .limit(1);

  const sparkDoc = db.doc(`Sparks/${req.params.sparkId}`);

  let sparkData;

  sparkDoc
    .get()
    .then(doc => {
      if (doc.exists) {
        sparkData = doc.data();
        sparkData.sparkId = doc.id;
        return heatDoc.get();
      } else {
        return res.status(404).json({ error: "Spark Not Found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection("SparkHeat")
          .add({
            sparkId: req.params.sparkId,
            alias: req.user.alias
          })
          .then(() => {
            sparkData.heat++;
            return sparkDoc.update({ heat: sparkData.heat });
          })
          .then(() => {
            return res.json(sparkData);
          });
      } else {
        return res.status(400).json({ error: "Spark already hot" });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Take heat from a spark
exports.removeSparkHeat = (req, res) => {
  const heatDoc = db
    .collection("SparkHeat")
    .where("alias", "==", req.user.alias)
    .where("sparkId", "==", req.params.sparkId)
    .limit(1);
  const sparkDoc = db.doc(`/Sparks/${req.params.sparkId}`);
  let sparkData;
  sparkDoc
    .get()
    .then(doc => {
      if (doc.exists) {
        sparkData = doc.data();
        sparkData.sparkId = doc.id;
        return heatDoc.get();
      } else {
        return res.status(404).json({ error: "Spark not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: "Spark already cold" });
      } else {
        return db
          .doc(`/SparkHeat/${data.docs[0].id}`)
          .delete()
          .then(() => {
            sparkData.heat--;
            return sparkDoc.update({ heat: sparkData.heat });
          })
          .then(() => {
            return res.json(sparkData);
          });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
