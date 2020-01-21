const { db } = require("../util/admin");

exports.postNewHowl = (req, res) => {
	if (req.body.howl.trim() === "")
		return res.status(400).json({ howl: "Field must not be empty" });

	const newDocKey = [req.user.clozang, req.params.friend].sort().join("::");

	const newHowl = {
		docKey: newDocKey,
		howlers: [req.params.friend, req.user.clozang],
		createdAt: new Date().toISOString(),
		receiverHasRead: false,
		howlings: [
			{
				howl: req.body.howl,
				sentBy: req.user.clozang,
				sentTo: req.params.friend
			}
		],
		howlCount: 1
	};

	db.collection("Howls")
		.doc(newHowl.docKey)
		.set(newHowl)
		.then(() => {
			const resHowl = newHowl;
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
					howlings: doc.data().howlings,
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
