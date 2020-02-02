const { db } = require("../util/admin");

exports.getUserFuserList = (req, res) => {
	db.doc(`/Users/${req.user.clozang}`)
		.get()
		.then(doc => {
			let fusersList = [];
			if (!doc.data().fusers || doc.data().fusers.length === 0) {
				return res.json({
					message:
						"You are not currently fused to anyone. Get out there and mingle some more."
				});
			} else {
				doc.data().fusers.forEach(fuser => {
					fusersList.push(fuser);
				});
			}
			let sortedFusers = fusersList.sort();
			return res.json(sortedFusers);
		})
		.catch(err => {
			console.error(err.code);
		});
};

exports.sendFuseRequest = (req, res) => {
	const newRequest = {
		sender: req.user.clozang,
		requested: req.params.fuser,
		sentAt: new Date().toISOString()
	};

	db.doc(`/Users/${req.user.clozang}`)
		.get()
		.then(doc => {
            let fusersArr = []
			doc.data().fusers.forEach(fuser => {
                fusersArr.push(fuser);
            })
            if(fusersArr.includes(req.params.fuser)){
				return res.json({
					message: "You are already fused with " + req.params.fuser});
			} else {
				return db
					.collection("Requests")
					.add(newRequest)
					.then(doc => {
						const resRequest = newRequest;
						resRequest.reqId = doc.id;
						console.log(
							"Your fuse request has been sent to ",
							req.params.fuser
						);
						res.json(resRequest);
					});
			}
		})
		.catch(err => {
			res.status(500).json({ error: "something went wrong" });
			console.error(err);
		});
};

// TODO prevent users from sending more than one request at a time