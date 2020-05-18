const { db, admin } = require("../util/admin");
const config = require("../util/config");
const { reduceSparkDetails } = require("../util/validators");

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
          userClozang: doc.data().userClozang,
          createdAt: doc.data().createdAt,
          stokeCount: doc.data().stokeCount,
          heatCount: doc.data().heatCount,
          userImage: doc.data().userImage,
          fire: doc.data().fire,
          emberable: doc.data().emberable,
          infernal: doc.data().infernal,
          sparkImage: doc.data().sparkImage,
          sparkVideo: doc.data().sparkVideo,
          sparkLink: doc.data().sparkLink
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
    createdAt: new Date().toISOString(),
    heatCount: 0,
    stokeCount: 0,
    userImage: req.user.imageUrl,
    fire: false,
    emberable: false,
    infernal: false,
    sparkImage: "",
    sparkVideo: "",
    sparkLink: ""
  };

  db.collection("Sparks")
    .add(newSpark)
    .then(doc => {
      doc.update({ sparkId: doc.id });
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
    userClozang: req.user.clozang,
    userImage: req.user.imageUrl
  };
  db.doc(`/Sparks/${req.params.sparkId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Spark has been extinguished" });
      }
      else if (doc.data().fire === true && doc.data().userClozang !== req.user.clozang) {
        return doc.ref.update({
          stokeCount: doc.data().stokeCount + 1,
          heatCount: doc.data().heatCount + 1 });
      }
      else if (doc.data().infernal === true && doc.data().userClozang !== req.user.clozang) {
        return doc.ref.update({
          stokeCount: doc.data().stokeCount + 1,
          heatCount: doc.data().heatCount + 1 });
      }
       else {
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
    .where("userClozang", "==", req.user.clozang)
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
            userClozang: req.user.clozang
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
    .where("userClozang", "==", req.user.clozang)
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
          else if(doc.data().userClozang !== req.user.clozang){
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

exports.getOnlyHottest = (req, res) => {
  db.collection("Sparks")
  .orderBy("heatCount", "desc")
  .get()
  .then(data => {
    let hotSparks = [];
    data.forEach(doc => {
      hotSparks.push({
        sparkId: doc.id,
        body: doc.data().body,
        userClozang: doc.data().userClozang,
        createdAt: doc.data().createdAt,
        stokeCount: doc.data().stokeCount,
        heatCount: doc.data().heatCount,
        userImage: doc.data().userImage,
        fire: doc.data().fire,
        emberable: doc.data().emberable,
        infernal: doc.data().infernal,
        sparkImage: doc.data().sparkImage,
        sparkVideo: doc.data().sparkVideo,
        sparkLink: doc.data().sparkLink
      });
    });
    return res.json(hotSparks);
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: err.code });
  });
};


exports.uploadSparkImage = (req, res) => {
	const BusBoy = require("busboy");
	const path = require("path");
	const os = require("os");
	const fs = require("fs");

	const busboy = new BusBoy({ headers: req.headers });

	let imageToBeUploaded = {};
	let imageFileName;

	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== "image/jpeg" && mimetype !== "image/png" && mimetype !== "image/gif") {
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
		const buckethead = admin.storage().bucket();

		buckethead
			.upload(imageToBeUploaded.filepath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: imageToBeUploaded.mimetype
					}
				}
			})
			.then(() => {
				const sparkImage = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        
        const newSparkImage = {
          body: "",
          userClozang: req.user.clozang,
          createdAt: new Date().toISOString(),
          heatCount: 0,
          stokeCount: 0,
          userImage: req.user.imageUrl,
          fire: false,
          emberable: false,
          infernal: false,
          sparkImage: sparkImage,
          sparkVideo: "",
          sparkLink: ""
        }
        
        db.collection("Sparks").add(newSparkImage)
        .then((doc) => {
          doc.update({ sparkId: doc.id });
          const resImg = newSparkImage;
          resImg.sparkId = doc.id;
        
        })
			})
			.then(() => {
				return res.status(200).json(resImg);
			})
			.catch(err => {
				console.error(err);
				return res.status(500).json({ error: err.code });
			});
	});
	busboy.end(req.rawBody);
};

exports.uploadSparkVideo = (req, res) => {
	const BusBoy = require("busboy");
	const path = require("path");
	const os = require("os");
	const fs = require("fs");

	const busboy = new BusBoy({ headers: req.headers });

	let videoToBeUploaded = {};
	let videoFileName;

	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== "video/mp4" && mimetype !== "video/webm" && mimetype !== "video/3gp") {
			return res.status(400).json({ error: "Wrong file type submitted" });
		}
		const videoExtension = filename.split(".")[filename.split(".").length - 1];
		videoFileName = `${Math.round(
			Math.random() * 10000000000000
		).toString()}.${videoExtension}`;
		const filepath = path.join(os.tmpdir(), videoFileName);
		videoToBeUploaded = { filepath, mimetype };
		file.pipe(fs.createWriteStream(filepath));
	});
	busboy.on("finish", () => {
		const buckethead = admin.storage().bucket();

		buckethead
			.upload(videoToBeUploaded.filepath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: videoToBeUploaded.mimetype
					}
				}
			})
			.then(() => {
				const sparkVideo = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${videoFileName}?alt=media`;
				return db.collection("SparkVideos").add({
          sparkID: req.params.sparkId,
          url: sparkVideo
        })
        .then(() => {
          return db.doc(`/Sparks/${req.params.sparkId}`).update({ sparkVideo: sparkVideo });
        })
			})
			.then(() => {
				return res.json({ message: "Video uploaded successfully" });
			})
			.catch(err => {
				console.error(err);
				return res.status(500).json({ error: err.code });
			});
	});
	busboy.end(req.rawBody);
};

exports.postSparkVideoLink = (req, res) => {
  if (req.body.link.trim() === '') return res.status(400).json({ link: 'Field must not be empty' });

  newVideoLink = {
    link: req.body.link,
    sparkId: req.params.sparkId
  }

  db.collection("SparkVideos").add({
    sparkID: newVideoLink.sparkId,
    url: newVideoLink.link
  })
  .then(() => {
    db.doc(`/Sparks/${req.params.sparkId}`).update({
      sparkVideo: newVideoLink.link
    })
  })
  .then(() => {
    res.status(200).json({ message: 'Video link saved'})
  })
  .catch(err => {
    console.log(err.code);
  });
};

exports.editASpark = (req, res) => {
	db.doc(`/Sparks/${req.params.sparkId}`)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Spark not found" });
			} else if (doc.data().userClozang !== req.user.clozang) {
				return res
					.status(403)
					.json({ error: "This action is forbidden by this user" });
			} else {
				doc.ref.update({ body: req.body.body });
			}
		})
		.then(() => {
			res.json({ message: "spark body changed to: " + req.body.body });
		})
		.catch((err) => {
			console.error({ error: err.code });
			res.status(500).json({ error: "Something went wrong" });
		});
};

