const { db } = require("../util/admin");

exports.postNewHowl = (req, res) => {
	if (req.body.howlBody.trim() === "")
		return res.status(400).json({ howlBody: "Field must not be empty" });

	const newDocKey = [req.user.clozang, req.params.friend].sort().join("::");

	let howlData = {}

	const newHowl = {
		docKey: newDocKey,
		howlers: [req.params.friend, req.user.clozang],
		createdAt: new Date().toISOString(),
		howlCount: 1,
		receiverHasRead: false	
	};

	const newHowling = {
		docKey: newDocKey,
		createdAt: new Date().toISOString(),
		howlBody: req.body.howlBody,
		sentBy: req.user.clozang,
		sentTo: req.params.friend,
		avatar: req.user.imageUrl 
	}

	db.collection("Howls")
		.doc(newHowl.docKey)
		.get()
		.then(doc => {
			if (doc.exists) {
				doc.ref.update({ howlCount: doc.data().howlCount + 1 });
				resHowl.howlData = doc.data();
				resHowl.howlData.howlCount = doc.data().howlCount + 1;
			} else {
				doc.ref.set(newHowl);
				resHowl.howlData = newHowl;
			}
		})
		.then(() => {
			return db.collection("Howlings").add(newHowling);
		})
		.then(doc => {
			resHowl.howlingData = newHowling;
			resHowl.howlingData.howlId = doc.id;
			res.json(resHowl);
		})
		.catch(err => {
			res.status(500).json({ error: "something went wrong" });
			console.error(err);
		});
};

exports.fetchUserHowls = (req, res) => {
	db.collection("Howls")
		.where("howlers", "array-contains", req.user.clozang)
		.get()
		.then(data => {
			let howls = [];
			data.forEach(doc => {
				howls.push({
					howlers: doc.data().howlers,
					receiverHasRead: doc.data().receiverHasRead,
					docKey: doc.data().docKey,
					createdAt: doc.data().createdAt,
					howlCount: doc.data().howlCount
				});
			});
			return res.json(howls);
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

exports.fetchCurrentHowlings = (req, res) => {
	db.collection("Howlings")
	.where("docKey", "==", req.params.docKey)
	.orderBy("createdAt", "asc")
	.get()
	.then(data => {
		let currentHowlings = [];
		data.forEach(doc => {
			currentHowlings.push({
				docKey: doc.data().docKey,
				howlId: doc.id,
				sentTo: doc.data().sentTo,
				sentBy: doc.data().sentBy,
				avatar: doc.data().avatar,
				cratedAt: doc.data().createdAt,
				howlBody: doc.data().howlBody
			})
		})
	})
}

exports.fetchFuserHowls = (req, res) => {
	let fuserHowls = [];
	db.collection("Howlings")
		.where("docKey", "==", [req.user.clozang, req.params.fuser].sort().join("::"))
		.orderBy("createdAt", "asc")
		.get()
		.then((data) => {
			data.forEach((doc) => {
				if (!doc.exists){
					return res.status(404).json({ message: "No howls currently exist between these fusers"});
				}
				else {
				fuserHowls.push({
					howlBody: doc.data().howlBody,
					sentTo: doc.data().sentTo,
					sentBy: doc.data().sentBy,
					createdAt: doc.data().createdAt,
					docKey: doc.data().docKey,
					avatar: doc.data().avatar,
					howlId: doc.id
				});
			}
			});
			return res.status(200).json(fuserHowls);
		})
		.catch((err) => {
			return res.status(500).json({ error: err.message });
		});
};

exports.fetchSingleHowl = (req, res) => {
	let howlData = {};
	db.collection("Howlings").where("docKey", "==", req.params.docKey)
	.orderBy("createdAt", "asc")	
	.get()
		.then((data) => {
			let howlings = [];
			data.forEach(doc => {
				howlings.push({
					docKey: doc.data().docKey,
					createdAt: doc.data().createdAt,
					howlBody: doc.data().howlBody,
					sentTo: doc.data().sentTo,
					sentBy: doc.data().sentBy,
					avatar: doc.data().avatar,
					howlId: doc.id
				});
			})
			return res.json(howlings);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

exports.silenceAHowl = (req, res) => {
	const howlToSilence = db.doc(`/Howlings/${req.params.howlId}`);
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
	db.doc(`/Howlings/${req.params.howlId}`)
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

// TODO create blocking functionality
