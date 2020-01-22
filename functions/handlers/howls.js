const { db } = require("../util/admin");

exports.postNewHowl = (req, res) => {
	if (req.body.howlBody.trim() === "")
		return res.status(400).json({ howlBody: "Field must not be empty" });
    
    const resHowl = {};

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
            if(doc.exists){
                doc.ref.update({ howlCount: doc.data().howlCount + 1})
                resHowl.howlData = doc.data();
                resHowl.howlData.howlCount = doc.data().howlCount + 1;
            }
            else{
            doc.ref.set(newHowl)
            resHowl.howlData = newHowl;
            }
        })
		.then(() => {
          return db.collection("Howlings").add(newHowling)
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

