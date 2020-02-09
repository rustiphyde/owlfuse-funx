const { db } = require("../util/admin");

exports.postNewHowl = (req, res) => {
	if (req.body.howlBody.trim() === "")
		return res.status(400).json({ howlBody: "Field must not be empty" });


	const newDocKey = [req.user.clozang, req.params.friend].sort().join("::");

	const newHowl = {
		docKey: newDocKey,
		howlers: [req.params.friend, req.user.clozang],
		createdAt: new Date().toISOString(),
		howlCount: 1
	};

	newHowling = {
		createdAt: new Date().toISOString(),
		docKey: newDocKey,
		howlBody: req.body.howlBody,
		sentBy: req.user.clozang,
		receiverHasRead: false,
		sentTo: req.params.friend
	};

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

exports.fetchSingleHowl = (req, res) => {
	let howlData = {};
	db.doc(`/Howls/${req.params.docKey}`)
		.get()
		.then(doc => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Howl does not exist" });
			} else if (!doc.data().howlers.includes(req.user.clozang)) {
				return res
					.status(403)
					.json({ error: "This action is forbidden to this account" });
			} else {
				howlData = doc.data();
				return db
					.collection("Howlings")
					.where("docKey", "==", req.params.docKey)
					.orderBy("createdAt", "asc")
					.get();
			}
		})
		.then(data => {
			howlData.howlings = [];
			data.forEach(doc => {
				howlData.howlings.push(doc.data());
			});
			return res.json(howlData);
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

exports.silenceAHowling = (req, res) => {
	const howlingToSilence = db.doc(`/Howlings/${req.params.howlId}`);
	howlingToSilence
		.get()
		.then(doc => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Howling not found" });
			} else if (doc.data().sentBy !== req.user.clozang) {
				return res
					.status(403)
					.json({ error: "This action is not permitted by this account" });
			} else {
				return howlingToSilence.delete();
			}
		})
		.then(() => {
			return res.json({ message: "Howling silenced completely" });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.silenceAHowl = (req, res) => {
	const howlToSilence = db.doc(`/Howls/${req.params.docKey}`);
	howlToSilence
		.get()
		.then(doc => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Howl not found" });
			} else if (!doc.data().howlers.includes(req.user.clozang)) {
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
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.editAHowling = (req, res) => {
	if(req.body.edit.trim() === ""){
		return res.status(400).json({ edit: "Field must not be empty" });
    }
    db.doc(`/Howlings/${req.params.howlId}`)
        .get()
        .then(doc => {
            if(!doc.exists){
                return res.status(404).json({ error: "Howl not found"});
            }
            else if(doc.data().sentBy !== req.user.clozang){
                return res.status(403).json({ error: "This action is forbidden by this user"});
            }
            else {
           doc.ref.update({ howlBody: req.body.edit })
            }
        })
        .then(() => {
            res.json({ message: "howling changed to: " + req.body.edit})
        })
		.catch(err => {
			console.error({ error: err.code });
			res.status(500).json({ error: "Something went wrong" });
		});
};

// TODO create blocking functionality
