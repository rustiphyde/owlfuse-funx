const { db, admin } = require("../util/admin");
const config = require("../util/config");
const firebase = require("firebase");

exports.getAllSparks = (req, res) => {
	db.collection("Sparks")
		.orderBy("createdAt", "desc")
		.get()
		.then((data) => {
			let sparks = [];
			data.forEach((doc) => {
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
					embered: doc.data().embered,
					emberCount: doc.data().emberCount,
					infernal: doc.data().infernal,
					sparkImage: doc.data().sparkImage,
					sparkVideo: doc.data().sparkVideo,
					sparkAudio: doc.data().sparkAudio,
					sparkLink: doc.data().sparkLink,
					emberId: doc.data().emberId,
					emberBody: doc.data().emberBody,
					emberPoster: doc.data().emberPoster,
					emberDate: doc.data().emberDate,
					emberVideo: doc.data().emberVideo,
					emberImage: doc.data().emberImage,
					emberAudio: doc.data().emberAudio,
					emberLink: doc.data().emberLink,

				});
			});
			return res.json(sparks);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

// Fetch one spark
exports.getSpark = (req, res) => {
	let sparkData = {};
	db.doc(`/Sparks/${req.params.sparkId}`)
		.get()
		.then((doc) => {
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
		.then((data) => {
			sparkData.stokes = [];
			data.forEach((doc) => {
				sparkData.stokes.push(doc.data());
			});
			return res.json(sparkData);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

exports.postOneSpark = (req, res) => {
	if (req.body.body.trim() === "")
		return res
			.status(400)
			.json({ spark: "Can't start a fire without a spark" });

	const newSpark = {
		body: req.body.body,
		userClozang: req.user.clozang,
		createdAt: new Date().toISOString(),
		heatCount: 0,
		stokeCount: 0,
		userImage: req.user.imageUrl,
		fire: false,
		emberable: false,
		embered: false,
		emberCount: 0,
		infernal: false,
		sparkImage: "",
		sparkVideo: "",
		sparkAudio: "",
		sparkLink: "",
		emberId: "",
		emberBody: "",
		emberPoster: "",
		emberDate: "",
		emberVideo: "",
		emberImage: "",
		emberAudio: "",
		emberLink: "",
	};

	db.collection("Sparks")
		.add(newSpark)
		.then((doc) => {
			const resSpark = newSpark;
			resSpark.sparkId = doc.id;
			res.json(resSpark);
		})
		.catch((err) => {
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
		userImage: req.user.imageUrl,
	};
	db.doc(`/Sparks/${req.params.sparkId}`)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Spark has been extinguished" });
			} else if (
				doc.data().fire === true &&
				doc.data().userClozang !== req.user.clozang
			) {
				return doc.ref.update({
					stokeCount: doc.data().stokeCount + 1,
					heatCount: doc.data().heatCount + 1,
				});
			} else if (
				doc.data().infernal === true &&
				doc.data().userClozang !== req.user.clozang
			) {
				return doc.ref.update({
					stokeCount: doc.data().stokeCount + 1,
					heatCount: doc.data().heatCount + 1,
				});
			} else {
				return doc.ref.update({
					stokeCount: doc.data().stokeCount + 1,
				});
			}
		})
		.then(() => {
			return db.collection("Stokes").add(newStoke);
		})
		.then(() => {
			res.json(newStoke);
		})
		.catch((err) => {
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
		.then((doc) => {
			if (doc.exists) {
				sparkData = doc.data();
				sparkData.sparkId = doc.id;
				return heatDoc.get();
			} else {
				return res.status(404).json({ error: "Spark Not Found" });
			}
		})
		.then((data) => {
			if (data.empty) {
				return db
					.collection("Heat")
					.add({
						sparkId: req.params.sparkId,
						userClozang: req.user.clozang,
					})
					.then(() => {
						sparkData.heatCount++;
						return sparkDoc.update({ heatCount: sparkData.heatCount });
					})
					.then(() => {
						return res.json(sparkData);
					});
			} else {
				return res
					.status(400)
					.json({ error: "Already added heat using this method" });
			}
		})
		.catch((err) => {
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
		.then((doc) => {
			if (doc.exists) {
				sparkData = doc.data();
				sparkData.sparkId = doc.id;
				return heatDoc.get();
			} else {
				return res.status(404).json({ error: "Spark not found" });
			}
		})
		.then((data) => {
			if (data.empty) {
				return res
					.status(400)
					.json({ error: "Already removed heat using this method" });
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
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

// Delete a spark
exports.extinguishSpark = (req, res) => {
	const docToExtinguish = db.doc(`/Sparks/${req.params.sparkId}`);
	docToExtinguish
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Spark not found" });
			} else if (doc.data().userClozang !== req.user.clozang) {
				return res
					.status(403)
					.json({ error: "This action is not permitted by this account" });
			} else {
				return docToExtinguish.delete();
			}
		})
		.then(() => {
			return res.json({ message: "Spark extinguished completely" });
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.getOnlyHottest = (req, res) => {
	db.collection("Sparks")
		.orderBy("heatCount", "desc")
		.get()
		.then((data) => {
			let hotSparks = [];
			data.forEach((doc) => {
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
					embered: doc.data().embered,
					emberCount: doc.data().emberCount,
					infernal: doc.data().infernal,
					sparkImage: doc.data().sparkImage,
					sparkVideo: doc.data().sparkVideo,
					sparkAudio: doc.data().sparkAudio,
					sparkLink: doc.data().sparkLink,
					emberId: doc.data().emberId,
					emberBody: doc.data().emberBody,
					emberPoster: doc.data().emberPoster,
					emberDate: doc.data().emberDate,
					emberVideo: doc.data().emberVideo,
					emberImage: doc.data().emberImage,
					emberAudio: doc.data().emberAudio,
					emberLink: doc.data().emberLink,
				});
			});
			return res.json(hotSparks);
		})
		.catch((err) => {
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
	let fields = {};
	let imageFileName;

	busboy.on("field", (key, value) => {
		fields[key] = value;
	});

	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		if (
			mimetype !== "image/jpeg" &&
			mimetype !== "image/png" &&
			mimetype !== "image/gif"
		) {
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
		req.body = fields;
		const buckethead = admin.storage().bucket();

		buckethead
			.upload(imageToBeUploaded.filepath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: imageToBeUploaded.mimetype,
					},
				},
			})
			.then(() => {
				const sparkImage = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;

				const newSpark = {
					body: req.body.body,
					userClozang: req.user.clozang,
					createdAt: new Date().toISOString(),
					heatCount: 0,
					stokeCount: 0,
					userImage: req.user.imageUrl,
					fire: false,
					emberable: false,
					embered: false,
					emberCount: 0,
					infernal: false,
					sparkImage: sparkImage,
					sparkVideo: "",
					sparkAudio: "",
					sparkLink: "",
					emberId: "",
					emberBody: "",
					emberPoster: "",
					emberDate: "",
					emberVideo: "",
					emberImage: "",
					emberAudio: "",
					emberLink: "",
					
				};

				db.collection("Sparks")
					.add(newSpark)
					.then((doc) => {
						doc.update({ sparkId: doc.id });
						const resImg = newSpark;
						resImg.sparkId = doc.id;
						res.status(200).json(resImg);
					});
			})
			.catch((err) => {
				console.error(err);
				return res.status(500).json({ error: err.code });
			});
	});
	busboy.end(req.rawBody);
};

exports.uploadSparkVideo = (req, res) => {
	if (req.body.body.trim() === "")
		return res
			.status(400)
			.json({ spark: "Can't start a fire without a spark" });
	if (req.body.embedLink.trim() === "")
		return res.status(400).json({ embedLink: "Field must not be empty" });
	
	const youtubeLink = req.body.embedLink.split("?v=");
	
	if (youtubeLink[0] === "https://www.youtube.com/watch") {
		req.body.embedLink = `https://youtube.com/embed/${youtubeLink[1]}`;
	}

	const newSpark = {
		body: req.body.body,
		userClozang: req.user.clozang,
		createdAt: new Date().toISOString(),
		heatCount: 0,
		stokeCount: 0,
		userImage: req.user.imageUrl,
		fire: false,
		emberable: false,
		embered: false,
		emberCount: 0,
		infernal: false,
		sparkImage: "",
		sparkVideo: req.body.embedLink,
		sparkAudio: "",
		sparkLink: "",
		emberId: "",
		emberBody: "",
		emberPoster: "",
		emberDate: "",
		emberVideo: "",
		emberImage: "",
		emberAudio: "",
		emberLink: "",
	};

	db.collection("Sparks")
		.add(newSpark)
		.then((doc) => {
			const resSpark = newSpark;
			resSpark.sparkId = doc.id;
			res.json(resSpark);
		})
		.catch((err) => {
			res.status(500).json({ error: "something went wrong" });
			console.error(err);
		});
};

exports.uploadSparkAudio = (req, res) => {
	const BusBoy = require("busboy");
	const path = require("path");
	const os = require("os");
	const fs = require("fs");

	const busboy = new BusBoy({ headers: req.headers });

	let audioToBeUploaded = {};
	let fields = {};
	let audioFileName;

	busboy.on("field", (key, value) => {
		fields[key] = value;
	});

	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== "audio/mpeg") {
			return res.status(400).json({ error: "Wrong file type submitted" });
		}
		const audioExtension = filename.split(".")[filename.split(".").length - 1];
		audioFileName = `${Math.round(
			Math.random() * 10000000000000
		).toString()}.${audioExtension}`;
		const filepath = path.join(os.tmpdir(), audioFileName);
		audioToBeUploaded = { filepath, mimetype };
		file.pipe(fs.createWriteStream(filepath));
	});
	busboy.on("finish", () => {
		req.body = fields;
		const buckethead = admin.storage().bucket();

		buckethead
			.upload(audioToBeUploaded.filepath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: audioToBeUploaded.mimetype,
					},
				},
			})
			.then(() => {
				const sparkAudio = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${audioFileName}?alt=media`;

				const newSpark = {
					body: req.body.body,
					userClozang: req.user.clozang,
					createdAt: new Date().toISOString(),
					heatCount: 0,
					stokeCount: 0,
					userImage: req.user.imageUrl,
					fire: false,
					emberable: false,
					embered: false,
					emberCount: 0,
					infernal: false,
					sparkImage: "",
					sparkVideo: "",
					sparkAudio: sparkAudio,
					sparkLink: "",
					emberId: "",
					emberBody: "",
					emberPoster: "",
					emberDate: "",
					emberVideo: "",
					emberImage: "",
					emberAudio: "",
					emberLink: "",
				};

				db.collection("Sparks")
					.add(newSpark)
					.then((doc) => {
						doc.update({ sparkId: doc.id });
						const resAud = newSpark;
						resAud.sparkId = doc.id;
						res.status(200).json(resAud);
					});
			})
			.catch((err) => {
				console.error(err);
				return res.status(500).json({ error: err.code });
			});
	});
	busboy.end(req.rawBody);
};

exports.postSparkVideoLink = (req, res) => {
	if (req.body.link.trim() === "")
		return res.status(400).json({ link: "Field must not be empty" });

	newVideoLink = {
		link: req.body.link,
		sparkId: req.params.sparkId,
	};

	db.collection("SparkVideos")
		.add({
			sparkID: newVideoLink.sparkId,
			url: newVideoLink.link,
		})
		.then(() => {
			db.doc(`/Sparks/${req.params.sparkId}`).update({
				sparkVideo: newVideoLink.link,
			});
		})
		.then(() => {
			res.status(200).json({ message: "Video link saved" });
		})
		.catch((err) => {
			console.log(err.code);
		});
};
