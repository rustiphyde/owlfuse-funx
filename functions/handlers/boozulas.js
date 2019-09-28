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
    clozang: req.user.clozang,
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