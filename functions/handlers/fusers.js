const { db, admin } = require("../util/admin");

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
		sentAt: new Date().toISOString(),
		accepted: false,
		rejected: false
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
				if (!doc.exists) {
					return res.json({
						message: "There are no fuse requests for you at this time."
					});
				}
				requestedArr.push({
					sender: doc.data().sender,
					requested: doc.data().requested,
					reqId: doc.id,
					sentAt: doc.data().sentAt,
					accepted: doc.data().accepted,
					rejected: doc.data().rejected
				});
			});
			if (requestedArr.length === 0) {
				return res.json({
					message: "There are no fuse requests for you at this time."
				});
			} else {
				return res.json(requestedArr);
			}
		})
		.catch(err => console.log(err));
};

exports.getAllSentFuses = (req, res) => {
	let sentArr = [];
	db.collection("Requests")
		.where("sender", "==", req.user.clozang)
		.get()
		.then(data => {
			data.forEach(doc => {
				if (!doc.exists) {
					res.json({
						message:
							"You don't currently have any pending fuse requests sent out"
					});
				} else {
					sentArr.push({
						requested: doc.data().requested,
						sender: doc.data().sender,
						sentAt: doc.data().sentAt,
						reqId: doc.id,
						accepted: doc.data().accepted,
						rejected: doc.data().rejected
					});
				}
			});
			if (sentArr.length === 0) {
				return res.json({
					message: "You don't currently have any pending fuse requests sent out"
				});
			} else {
				return res.json(sentArr);
			}
		})
		.catch(err => console.log(err));
};

exports.acceptFuseRequest = (req, res) => {
	db.doc(`/Requests/${req.params.reqId}`)
		.get()
		.then(doc => {
			if (!doc.exists) {
				return res.status(404).json({
					error: "This request either no longer exists or has been cancelled"
				});
			} else if (doc.data().requested !== req.user.clozang) {
				return res
					.status(403)
					.json({ error: "This action is not allowed on this account" });
			} else {
				const senderData = doc.data().sender;
				doc.ref
					.update({ accepted: true })
					.then(() => {
						db.collection("Users")
							.doc(senderData)
							.update({
								fusers: admin.firestore.FieldValue.arrayUnion(req.user.clozang)
							});
					})
					.then(() => {
						db.doc(`/Users/${req.user.clozang}`).update({
							fusers: admin.firestore.FieldValue.arrayUnion(senderData)
						});
					});
				return res
					.status(200)
					.json({ message: "You've been fused with " + senderData });
			}
		})
		.catch(err => {
			return res.status(500).json({ error: err.code });
		});
};

exports.rejectFuseRequest = (req, res) => {
	db.doc(`/Requests/${req.params.reqId}`)
		.get()
		.then(doc => {
			if (!doc.exists) {
				return res.status(404).json({
					error: "This request either does not exist or has been cancelled"
				});
			} else if (doc.data().requested !== req.user.clozang) {
				return res
					.status(403)
					.json({ error: "This action is not permitted by this account" });
			} else {
				doc.ref.update({ rejected: true });
				return res.status(200).json({
					message: "You have refused to fuse with " + doc.data().sender
				});
			}
		})
		.catch(err => {
			return res.status(500).json({ error: err.code });
		});
};


