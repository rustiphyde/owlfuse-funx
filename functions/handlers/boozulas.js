const { admin, db } = require("../util/admin");
const config = require("../util/config");
const { reduceBoozDetails } = require("../util/validators");

// Build New Boozula
exports.buildNewBoozula = (req, res) => {
  

  if (req.body.drinkName.trim() === "")
    return res.status(400).json({ drinkName: "Field must not be empty" });
  if (req.body.mainAlcohol.trim() === "")
    return res.status(400).json({ mainAlcohol: "Field must not be empty" });
  
  const noImg = "blank-drink-pic.png";

  const newBoozula = {
    drinkName: req.body.drinkName,
    mainAlcohol: req.body.mainAlcohol,
    alias: req.user.alias,
    klozang: req.user.clozang,
    boozImage: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
    createdAt: new Date().toISOString(),
    cheersCount: 0,
    toastCount: 0,
    ingredients: req.body.ingredients,
    preparation: req.body.preparation,
    drinkWare: req.body.drinkWare
  };

  db.collection("Boozulas")
    .add(newBoozula)
    .then(doc => {
      const resBooz = newBoozula;
      resBooz.boozId = doc.id;
      res.json(resBooz);
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};

exports.uploadBoozImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 10000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const boozImage = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/Boozulas/${req.params.boozId}`).update({ boozImage });
      })
      .then(() => {
        return res.json({ message: "Image uploaded successfully" });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};

exports.getAllBoozulas = (req, res) => {
  db.collection("Boozulas")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let booz = [];
      data.forEach(doc => {
        booz.push({
          boozId: doc.id,
          drinkName: doc.data().drinkName,
          mainAlcohol: doc.data().mainAlcohol,
          alias: doc.data().alias,
          klozang: doc.data().klozang,
          boozImage: doc.data().boozImage,
          createdAt: doc.data().createdAt,
          cheersCount: doc.data().cheersCount,
          toastCount: doc.data().toastCount,
          ingredients: doc.data().ingredients,
          preparation: doc.data().preparation,
          drinkWare: doc.data().drinkWare
        });
      });
      return res.json(booz);
    })
    .catch(err => console.log(err));
};

exports.getBoozula = (req, res) => {
  let boozData = {};
  db.doc(`/Boozulas/${req.params.boozId}`).get()
      .then((doc) => {
          if(!doc.exists){
              return res.status(404).json({ error: 'Boozula not found'})
          }
          boozData = doc.data();
          boozData.boozId = doc.id;
          return db.collection('Toasts').where('boozId', '==', doc.id).get();
      })
      .then(data => {
          boozData.toasts = [];
          data.forEach(doc => {
              boozData.toasts.push(doc.data())
          });
          return res.json(boozData);
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({ error: err.code});
      });
};

exports.addBoozDetails = (req, res) => {
  let boozDetails = reduceBoozDetails(req.body);

  db.doc(`/Boozulas/${req.params.boozId}`)
    .update(boozDetails)
    .then(() => {
      return res.json({ message: "Details added successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.addCheers = (req, res) => {
  const cheersDoc = db.collection('Cheers').where('alias', '==', req.user.alias)
  .where('boozId', '==', req.params.boozId).limit(1);

  const boozDoc = db.doc(`/Boozulas/${req.params.boozId}`);

  let boozData;

  boozDoc.get()
      .then(doc => {
          if(doc.exists){
              boozData = doc.data();
              boozData.boozId = doc.id;
              return cheersDoc.get();
          } else {
              return res.status(404).json({ error: 'Boozula not found'});
          }
      })
      .then(data => {
          if(data.empty){
              return db.collection('Cheers').add({
                 boozId: req.params.boozId,
                 alias: req.user.alias 
              })
              .then(() => {
                  boozData.cheersCount++
                  return boozDoc.update({ cheersCount: boozData.cheersCount})
              })
              .then(() => {
                  return res.json(boozData);
              })
          } else {
              return res.status(400).json({ error: 'Boozula has a cheers already'});
          }
      })
      .catch(err => {
          console.error(err);
          return res.status(500).json({error: err.code});
      });
};

exports.removeCheers = (req, res) => {
  const cheersDoc = db.collection('Cheers').where('alias', '==', req.user.alias)
  .where('boozId', '==', req.params.boozId).limit(1);

  const boozDoc = db.doc(`/Boozulas/${req.params.boozId}`);

  let boozData;

  boozDoc.get()
      .then(doc => {
          if(doc.exists){
              boozData = doc.data();
              boozData.boozId = doc.id;
              return cheersDoc.get();
          } else {
              return res.status(404).json({ error: 'Boozula not found'});
          }
      })
      .then(data => {
          if(data.empty){
              return res.status(400).json({ error: 'No cheers on this Boozula yet'});
              
          } else {
              return db.doc(`/Cheers/${data.docs[0].id}`).delete()
                  .then(() => {
                      boozData.cheersCount--;
                      return boozDoc.update({cheersCount: boozData.cheersCount})
                  })
                  .then(() => {
                      return res.json(boozData);
                  })
          }
      })
      .catch(err => {
          console.error(err);
          return res.status(500).json({error: err.code});
      });
};

exports.emptyBoozula = (req, res) => {
  const boozToEmpty = db.doc(`/Boozulas/${req.params.boozId}`);

  boozToEmpty.get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Boozula not found' });
      }
      else if (doc.data().klozang !== req.user.clozang) {
        return res.status(403).json({ error: 'This action is not permitted by this account' });
      }
      else {
        return boozToEmpty.delete();
      }
    })
    .then(() => {
      return res.json({ message: 'Boozula emptied completely' });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.toastBoozula = (req, res) => {
  if (req.body.body.trim() === '') return res.status(400).json({ convo: 'Field must not be empty' });

  const newToast = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    boozId: req.params.boozId,
    klozang: req.user.clozang,
    alias: req.user.alias,
    userImage: req.user.imageUrl
  };

  db.doc(`/Boozulas/${req.params.boozId}`).get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Boozula has been emptied' });
      }
      return doc.ref.update({ toastCount: doc.data().toastCount + 1 });
    })
    .then(() => {
      return db.collection('Toasts').add(newToast);
    })
    .then(() => {
      res.json(newToast);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    })
};