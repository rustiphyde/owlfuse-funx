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

exports.getFire = (req, res) => {
  let fireData = {};
  db.doc(`/Fires/${req.params.fireId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Fire not found" });
      }
      fireData = doc.data();
      fireData.fireId = doc.id;
      return db
        .collection("FireStokes")
        .where("fireId", "==", req.params.fireId)
        .get();
    })
    .then(data => {
      fireData.stokes = [];
      data.forEach(doc => {
        fireData.stokes.push(doc.data());
      });
      return res.json(fireData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.stokeFire = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ stoke: "Field must not be empty" });

  const newStoke = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    fireId: req.params.fireId,
    alias: req.user.alias,
    clozang: req.user.clozang,
    userImage: req.user.imageUrl,
  };

  db.doc(`/Fires/${req.params.fireId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Fire has been extinguished" });
      }
      return doc.ref.update({
        stokeCount: doc.data().stokeCount + 1,
        heat: doc.data().heat + 1
      });
    })
    .then(() => {
      return db.collection("FireStokes").add(newStoke);
    })
    .then(() => {
      res.json(newStoke);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};

exports.addFireHeat = (req, res) => {
  const heatDoc = db.collection('FireHeat').where('alias', '==', req.user.alias)
  .where('fireId', '==', req.params.fireId).limit(1);

  const fireDoc = db.doc(`/Fires/${req.params.fireId}`);

  let fireData;

  fireDoc.get()
      .then(doc => {
          if(doc.exists){
              fireData = doc.data();
              fireData.fireId = doc.id;
              return heatDoc.get();
          } else {
              return res.status(404).json({ error: 'Fire not ignited' });
          }
      })
      .then(data => {
          if(data.empty){
              return db.collection('FireHeat').add({
                 fireId: req.params.fireId,
                 alias: req.user.alias 
              })
              .then(() => {
                  fireData.heat++
                  return fireDoc.update({ heat: fireData.heat})
              })
              .then(() => {
                  return res.json(fireData);
              })
          } else {
              return res.status(400).json({ error: 'Already added heat using this method'});
          }
      })
      .catch(err => {
          console.error(err);
          return res.status(500).json({error: err.code});
      });
};

exports.removeFireHeat = (req, res) => {
  const heatDoc = db.collection('FireHeat').where('alias', '==', req.user.alias)
  .where('fireId', '==', req.params.fireId).limit(1);

  const fireDoc = db.doc(`/Fires/${req.params.fireId}`);

  let fireData;

  fireDoc.get()
      .then(doc => {
          if(doc.exists){
              fireData = doc.data();
              fireData.fireId = doc.id;
              return heatDoc.get();
          } else {
              return res.status(404).json({ error: 'Fire not found'});
          }
      })
      .then(data => {
          if(data.empty){
              return res.status(400).json({ error: 'Already removed heat using this method'});
              
          } else {
              return db.doc(`/FireHeat/${data.docs[0].id}`).delete()
                  .then(() => {
                      fireData.heat--;
                      return fireDoc.update({heat: fireData.heat})
                  })
                  .then(() => {
                      return res.json(fireData);
                  })
          }
      })
      .catch(err => {
          console.error(err);
          return res.status(500).json({error: err.code});
      });
};