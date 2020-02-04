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
			let fusersArr = [];
			doc.data().fusers.forEach(fuser => {
				fusersArr.push(fuser);
			});
			if (fusersArr.includes(req.params.fuser)) {
				return res.json({
					message: "You are already fused with " + req.params.fuser
				});
			} else {
				let reqArray = [];
				db.collection("Requests")
					.where("sender", "==", `${req.user.clozang}`)
					.orderBy("sentAt", "desc")
					.get()
					.then(data => {
						data.forEach(doc => {
							reqArray.push(doc.data().requested);
						});
						if (reqArray.includes(req.params.fuser)) {
							return res.json({
								message:
									"You have already sent this user a fuse request. Please allow them time to respond to the current request before sending another."
							});
						} else {
							db.collection("Requests")
								.add(newRequest)
								.then(doc => {
									const resReq = newRequest;
									resReq.reqId = doc.id;
									return res.status(200).json({
										message: `Your request to ${req.params.fuser} has been sent.`,
										details: resReq
									});
								});
						}
					});
			}
		})
		.catch(err => {
			res.status(500).json({ error: "something went wrong" });
			console.error(err);
		});
};

exports.getAllRequestedFuses = (req, res) => {
	let requestedArr = [];
	db.collection("Requests")
		.where("requested", "==", req.user.clozang)
		.get()
		.then(data => {
			data.forEach(doc => {
                if(!doc.exists){
                return res.json({ message: "There are no fuse requests for you at this time."})
                }
				requestedArr.push({
					sender: doc.data().sender,
					requested: doc.data().requested,
					reqId: doc.id,
					sentAt: doc.data().sentAt
				});
            });
            if(requestedArr.length === 0){
                return res.json({ message: "There are no fuse requests for you at this time."})
                }
            else{
            return res.json(requestedArr);
            }
		})
		.catch(err => console.log(err));
};
