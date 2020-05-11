const { db } = require("../util/admin");

// exports.postNewHowl = (req, res) => {
// 	if (req.body.howlBody.trim() === "")
// 		return res.status(400).json({ howl: "Field must not be empty" });

// 	let resHowl = {};

// 	const newDocKey = [req.user.clozang, req.params.fuser].sort().join("::");

// 	const newHowl = {
// 		docKey: newDocKey,
// 		howlers: [req.user.clozang, req.params.fuser],
// 		howlCount: 1,
// 		receiverHasread: false,
// 		howlings: [
// 			{
// 				sentBy: req.user.clozang,
// 				sentTo: req.params.fuser,
// 				avatar: req.user.imageUrl,
// 				howlBody: req.body.howlBody,
// 				createdAt: new Date().toISOString(),
// 			},
// 		],
// 	};

// 	db.collection("Howls")
// 		.doc(newDocKey)
// 		.get()
// 		.then((doc) => {
// 			if (doc.exists) {
// 				doc.ref
// 					.update({
// 						howlCount: doc.data().howlCount + 1,
// 						howlings: firebase.firestore.FieldValue.arrayUnion({
// 							sentBy: req.user.clozang,
// 							sentTo: req.params.fuser,
// 							avatar: req.user.imageUrl,
// 							howlBody: req.body.howlBody,
// 							createdAt: new Date().toISOString(),
// 						}),
// 					})
// 					.then((doc) => {
// 						resHowl = doc.data();
// 						res.status(200).json(resHowl);
// 					});
// 			} else {
// 				db.collection("Howls")
// 					.doc(newDocKey)
// 					.set(newHowl)
// 					.then(() => {
// 						resHowl = newHowl;
// 						res.status(200).json(resHowl);
// 					});
// 			}
// 		})
// 		.catch((err) => {
// 			res.status(500).json({ error: err.message });
// 		});
// };
exports.postNewHowl = (req, res) => {
	if (req.body.howlBody.trim() === "")
		return res.status(400).json({ howlBody: "Field must not be empty" });

	let resHowl = {};

	const newDocKey = [req.user.clozang, req.params.friend].sort().join("::");

	const newHowl = {
		docKey: newDocKey,
		howlers: [req.params.friend, req.user.clozang],
		createdAt: new Date().toISOString(),
		howlBody: req.body.howlBody,
		sentBy: req.user.clozang,
		sentTo: req.params.friend,
		receiverHasRead: false,
		avatar: req.user.imageUrl,
		howlId: ""
	};

	db.collection("Howls")
		.add(newHowl)
		.then((doc) => {
			doc.update({ howlId: doc.id });
			resHowl = newHowl;
			resHowl.howlId = doc.id;
			res.json(resHowl);
		})
		.catch((err) => {
			res.status(500).json({ error: "something went wrong" });
			console.error(err);
		});
};

exports.fetchUserHowls = (req, res) => {
	db.collection("Howls")
		.where("howlers", "array-contains", req.user.clozang)
		.get()
		.then((data) => {
			let howls = [];
			data.forEach((doc) => {
				howls.push({
					createdAt: doc.data().createdAt,
					docKey: doc.data().docKey,
					howlers: doc.data().howlers,
					receiverHasRead: doc.data().receiverHasRead,
					howlBody: doc.data().howlBody,
					sentBy: doc.data().sentBy,
					sentTo: doc.data().sentTo,
					avatar: doc.data().avatar,
					howlId: doc.id,
				});
			});
			return res.json(howls);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

exports.fetchFuserHowls = (req, res) => {
	let fuserHowls = [];
	db.collection("Howls")
		.where(
			"docKey",
			"==",
			[req.user.clozang, req.params.fuser].sort().join("::")
		)
		.orderBy("createdAt", "asc")
		.get()
		.then((data) => {
			data.forEach((doc) => {
				if (!doc.exists) {
					return res
						.status(404)
						.json({ message: "No howls currently exist between these fusers" });
				} else {
					fuserHowls.push({
						createdAt: doc.data().createdAt,
						docKey: doc.data().docKey,
						howlers: doc.data().howlers,
						receiverHasRead: doc.data().receiverHasRead,
						howlBody: doc.data().howlBody,
						sentBy: doc.data().sentBy,
						sentTo: doc.data().sentTo,
						avatar: doc.data().avatar,
						howlId: doc.id,
					});
				}
				return res.status(200).json(fuserHowls);
			});
		})
		.catch((err) => {
			return res.status(500).json({ error: err.message });
		});
};

exports.fetchSingleHowl = (req, res) => {
	let howlData = [];
	db.collection(`/Howls/`)
		.where("docKey", "==", req.params.docKey)
		.orderBy("createdAt", "asc")
		.get()
		.then((data) => {
			data.forEach((doc) => {
				howlData.push({
					createdAt: doc.data().createdAt,
					docKey: doc.data().docKey,
					howlers: doc.data().howlers,
					receiverHasRead: doc.data().receiverHasRead,
					howlBody: doc.data().howlBody,
					sentBy: doc.data().sentBy,
					sentTo: doc.data().sentTo,
					avatar: doc.data().avatar,
					howlId: doc.id,
				});
			});
			return res.json(howlData);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

exports.silenceAHowl = (req, res) => {
	const howlToSilence = db.doc(`/Howls/${req.params.howlId}`);
	howlToSilence
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Howl not found" });
			} else if (doc.data().sentBy !== req.user.clozang) {
				return res
					.status(403)
					.json({ error: "This action is not permitted by this account" });
			} else {
				return howlToSilence.delete();
			}
		})
		.then(() => {
			return res.json({ message: "Howl silenced completely" });
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.editAHowl = (req, res) => {
	if (req.body.howlBody.trim() === "") {
		return res.status(400).json({ howlBody: "Field must not be empty" });
	}
	db.doc(`/Howls/${req.params.howlId}`)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Howl not found" });
			} else if (doc.data().sentBy !== req.user.clozang) {
				return res
					.status(403)
					.json({ error: "This action is forbidden by this user" });
			} else {
				doc.ref.update({ howlBody: req.body.howlBody });
			}
		})
		.then(() => {
			res.json({ message: "howl changed to: " + req.body.howlBody });
		})
		.catch((err) => {
			console.error({ error: err.code });
			res.status(500).json({ error: "Something went wrong" });
		});
};

exports.increaseHowlCount = (req, res) => {
	const newCount = {
		docKey: req.params.docKey,
		howlCount: 1,
	};

	db.collection("HowlCounts")
		.where("docKey", "==", req.params.docKey)
		.get()
		.then((data) => {
			let resCount = {};
			data.forEach((doc) => {
				if (doc.exists) {
					doc.ref.update({ howlCount: doc.data().howlCount + 1 });
				} else {
					return db
						.collection("HowlCounts")
						.add(newCount)
						.then((doc) => {
							resCount = newCount;
							resCount.countId = doc.id;
							res.json(resCount);
						});
				}
			});
		})
		.catch((err) => console.error(err.code));
};

exports.getHowlCount = (req, res) => {
	let countData = {};
	db.collection("HowlCounts")
		.where("docKey", "==", req.params.docKey)
		.get()
		.then((data) => {
			data.forEach((doc) => {
				if (!doc.exists) {
					return res.status(404).json({ error: "No count not found" });
				}
				countData = doc.data();
				countData.countId = doc.id;
			});
			return res.json(countData);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

// TODO create blocking functionality
