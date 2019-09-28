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
    email: req.user.email,
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