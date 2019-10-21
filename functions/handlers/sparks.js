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
          userAlias: doc.data().userAlias,
          userClozang: doc.data().userClozang,
          createdAt: doc.data().createdAt,
          stokeCount: doc.data().stokeCount,
          heatCount: doc.data().heatCount,
          userImage: doc.data().userImage,
          fire: doc.data().fire
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
        .collection("Stokes")
        .where("sparkId", "==", req.params.sparkId)
        .orderBy("createdAt", "desc")
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
  if (req.body.body.trim() === '') return res.status(400).json({ spark: 'Can\'t start a fire without a spark' });
  
  const newSpark = {
    body: req.body.body,
    userClozang: req.user.clozang,
    userAlias: req.user.alias,
    createdAt: new Date().toISOString(),
    heatCount: 0,
    stokeCount: 0,
    userImage: req.user.imageUrl,
    fire: false
  };

  db.collection("Sparks")
    .add(newSpark)
    .then(doc => {
      const resSpark = newSpark;
        resSpark.sparkId = doc.id;
        res.json(resSpark);
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
    userAlias: req.user.alias,
    userClozang: req.user.clozang,
    userImage: req.user.imageUrl
  };
  db.doc(`/Sparks/${req.params.sparkId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Spark has been extinguished" });
      }
      if (doc.ref.fire === true && doc.ref.userAlias !== req.user.alias) {
        return doc.ref.update({
          stokeCount: doc.data().stokeCount + 1,
          heatCount: doc.data().heatCount + 1 });
      } else {
        return doc.ref.update({
          stokeCount: doc.data().stokeCount + 1
        })
      }
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
exports.addHeat = (req, res) => {
  const heatDoc = db
    .collection("Heat")
    .where("userAlias", "==", req.user.alias)
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
          .collection("Heat")
          .add({
            sparkId: req.params.sparkId,
            userAlias: req.user.alias
          })
          .then(() => {
            sparkData.heatCount++;
            return sparkDoc.update({ heatCount: sparkData.heatCount });
          })
          .then(() => {
            return res.json(sparkData);
          });
      } else {
        return res.status(400).json({ error: "Already added heat using this method" });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Take heat from a spark
exports.removeHeat = (req, res) => {
  const heatDoc = db
    .collection("Heat")
    .where("userAlias", "==", req.user.alias)
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
        return res.status(400).json({ error: "Already removed heat using this method" });
      } else {
        return db
          .doc(`/Heat/${data.docs[0].id}`)
          .delete()
          .then(() => {
            sparkData.heatCount--;
            return sparkDoc.update({ heatCount: sparkData.heatCount });
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

// Delete a spark
exports.extinguishSpark = (req, res) => {
  const docToExtinguish = db.doc(`/Sparks/${req.params.sparkId}`);
  docToExtinguish.get()
      .then(doc => {
          if(!doc.exists){
              return res.status(404).json({ error: 'Spark not found'});
          } 
          else if(doc.data().userAlias !== req.user.alias){
              return res.status(403).json({ error: 'This action is not permitted by this account'});
          }
          else {
              return docToExtinguish.delete();
          }
      })
      .then(() => {
          return res.json({ message: 'Spark extinguished completely'});
      })
      .catch(err => {
          console.error(err);
          return res.status(500).json({ error: err.code});
      });
};