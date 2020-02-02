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
