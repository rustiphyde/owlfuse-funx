const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./util/fbAuth");

const cors = require("cors");
app.use(cors());

const { db } = require("./util/admin");

const {
	getUserFuserList,
	sendFuseRequest,
	getAllRequestedFuses,
	fetchOneRequest,
	getAllSentFuses,
	acceptFuseRequest,
	rejectFuseRequest,
	cancelFuseRequest,
	defuseWithUser,
	silenceFuser,
	fetchUserSilencedList,
	unsilenceFuser
} = require("./handlers/fusers");

const {
	postNewHowl,
	fetchUserHowls,
	fetchSingleHowl,
	silenceAHowling,
	silenceAHowl,
	editAHowling
} = require("./handlers/howls");

const {
	getAllSparks,
	postOneSpark,
	getSpark,
	stokeSpark,
	addHeat,
	removeHeat,
	extinguishSpark,
	getOnlyHottest
} = require("./handlers/sparks");

const {
	buildNewOkeList,
	getAllOkelists,
	getOke,
	addOneSong,
	getSongsByList,
	getSongsByArtist,
	getSongsByAlias,
	choozByList,
	choozByArtist,
	choozByAlias,
	choozFromAllSongs,
	eraseOkelist
} = require("./handlers/okelists");

const {
	buildNewBoozula,
	uploadBoozImage,
	getAllBoozulas,
	getBoozula,
	addCheers,
	removeCheers,
	toastBoozula,
	addBoozDetails,
	emptyBoozula
} = require("./handlers/boozulas");

const {
	signup,
	login,
	uploadImage,
	addUserDetails,
	getAuthenticatedUser,
	getUserDetails,
	markSizzlesRead,
	markClinksRead,
	resetPassword
} = require("./handlers/users");

// Spark routes
app.get("/sparks", getAllSparks);
app.post("/spark", FBAuth, postOneSpark);
app.get("/spark/:sparkId", getSpark);
app.post("/spark/:sparkId/stoke", FBAuth, stokeSpark);
app.get("/spark/:sparkId/burn", FBAuth, addHeat);
app.get("/spark/:sparkId/snuff", FBAuth, removeHeat);
app.delete("/spark/:sparkId", FBAuth, extinguishSpark);
app.get("/hot/sparks", getOnlyHottest);
// Fuser routes
app.get("/fusers", FBAuth, getUserFuserList);
app.post("/fuse-with/:fuser", FBAuth, sendFuseRequest);
app.get("/requested-fuses", FBAuth, getAllRequestedFuses);
app.get("/sent-fuses", FBAuth, getAllSentFuses);
app.get("/fetch/:reqId", FBAuth, fetchOneRequest);
app.get("/accept/:reqId", FBAuth, acceptFuseRequest);
app.get("/reject/:reqId", FBAuth, rejectFuseRequest);
app.delete("/cancel/:reqId", FBAuth, cancelFuseRequest);
app.get("/defuse/:fuser", FBAuth, defuseWithUser);
app.get("/silence/:fuser", FBAuth, silenceFuser);
app.get("/silenced", FBAuth, fetchUserSilencedList);
app.get("/unsilence/:fuser", FBAuth, unsilenceFuser);
// Howl routes
app.post("/howl/:friend", FBAuth, postNewHowl);
app.get("/howls", FBAuth, fetchUserHowls);
app.get("/howl/:docKey", FBAuth, fetchSingleHowl);
app.delete("/howling/:howlId", FBAuth, silenceAHowling);
app.delete("/howl/:docKey", FBAuth, silenceAHowl);
app.post("/howling/edit/:howlId", FBAuth, editAHowling);
// User routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.post("/sizzles", FBAuth, markSizzlesRead);
app.post("/clinks", FBAuth, markClinksRead);
app.get("/:clozang", getUserDetails);
app.post("/reset", resetPassword);

// Oke routes
app.post("/okelist", FBAuth, buildNewOkeList);
app.get("/okelists", getAllOkelists);
app.get("/okelist/:okeId", getOke);
app.post("/okelist/:okeId/song", FBAuth, addOneSong);
app.get("/songs/:okeId/list", getSongsByList);
app.get("/songs/:artist/artist", getSongsByArtist);
app.get("/songs/:alias/alias", getSongsByAlias);
app.get("/song/:okeId/list/chooz", choozByList);
app.get("/song/:artist/artist/chooz", choozByArtist);
app.get("/song/:alias/alias/chooz", choozByAlias);
app.get("/song/all/chooz", choozFromAllSongs);
app.delete("/okelist/:okeId", FBAuth, eraseOkelist);

// Boozula Routes
app.post("/boozula", FBAuth, buildNewBoozula);
app.post("/boozula/:boozId/image", FBAuth, uploadBoozImage);
app.get("/boozulas", getAllBoozulas);
app.get("/boozula/:boozId", getBoozula);
app.get("/boozula/:boozId/cheers", FBAuth, addCheers);
app.get("/boozula/:boozId/unCheers", FBAuth, removeCheers);
app.post("/boozula/:boozId/toast", FBAuth, toastBoozula);
app.post("/boozula/:boozId/add", FBAuth, addBoozDetails);
app.delete("/boozula/:boozId", FBAuth, emptyBoozula);

// Inform Firebase that 'app' is the container for all routes in application
exports.api = functions.https.onRequest(app);

exports.createSizzleOnHeat = functions.firestore
	.document("Heat/{id}")
	.onCreate(snap => {
		return db
			.doc(`/Sparks/${snap.data().sparkId}`)
			.get()
			.then(doc => {
				if (doc.exists && doc.data().userAlias !== snap.data().userAlias) {
					return db.doc(`/Sizzles/${snap.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userAlias,
						sender: snap.data().userAlias,
						type: "heat",
						read: false,
						sparkId: doc.id,
						sizzleId: snap.id
					});
				}
			})
			.catch(err => console.error(err));
	});

exports.createClinkOnCheers = functions.firestore
	.document("Cheers/{id}")
	.onCreate(snap => {
		return db
			.doc(`/Boozulas/${snap.data().boozId}`)
			.get()
			.then(doc => {
				if (doc.exists && doc.data().userAlias !== snap.data().userAlias) {
					return db.doc(`/Clinks/${snap.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userAlias,
						sender: snap.data().userAlias,
						type: "cheers",
						read: false,
						boozId: doc.id,
						clinkId: snap.id
					});
				}
			})
			.catch(err => console.error(err));
	});

exports.createSizzleOnStoke = functions.firestore
	.document("Stokes/{id}")
	.onCreate(snap => {
		return db
			.doc(`/Sparks/${snap.data().sparkId}`)
			.get()
			.then(doc => {
				if (doc.exists && doc.data().userAlias !== snap.data().userAlias) {
					return db.doc(`/Sizzles/${snap.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userAlias,
						sender: snap.data().userAlias,
						type: "stoke",
						read: false,
						sparkId: doc.id,
						sizzleId: snap.id
					});
				}
			})
			.catch(err => console.error(err));
	});

exports.createClinkOnToast = functions.firestore
	.document("Toasts/{id}")
	.onCreate(snap => {
		return db
			.doc(`/Boozulas/${snap.data().boozId}`)
			.get()
			.then(doc => {
				if (doc.exists && doc.data().userAlias !== snap.data().userAlias) {
					return db.doc(`/Clinks/${snap.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userAlias,
						sender: snap.data().userAlias,
						type: "toast",
						read: false,
						boozId: doc.id,
						clinkId: snap.id
					});
				}
			})
			.catch(err => console.error(err));
	});

exports.removeHeatSizzle = functions.firestore
	.document("Heat/{id}")
	.onDelete(snap => {
		return db
			.doc(`/Sizzles/${snap.id}`)
			.delete()
			.catch(err => console.error(err));
	});

exports.removeCheersClink = functions.firestore
	.document("Cheers/{id}")
	.onDelete(snap => {
		return db
			.doc(`/Clinks/${snap.id}`)
			.delete()
			.catch(err => console.error(err));
	});

exports.onUserImageChange = functions.firestore
	.document("/Users/{Id}")
	.onUpdate(change => {
		if (change.before.data().imageUrl !== change.after.data().imageUrl) {
			const batch = db.batch();
			return db
				.collection("Sparks")
				.where("userAlias", "==", change.before.data().alias)
				.get()
				.then(data => {
					data.forEach(doc => {
						const spark = db.doc(`/Sparks/${doc.id}`);
						batch.update(spark, { userImage: change.after.data().imageUrl });
					});
					return db
						.collection("Stokes")
						.where("userAlias", "==", change.before.data().alias)
						.get();
				})
				.then(data => {
					data.forEach(doc => {
						const stoke = db.doc(`/Stokes/${doc.id}`);
						batch.update(stoke, { userImage: change.after.data().imageUrl });
					});
					return db
						.collection("Toasts")
						.where("userAlias", "==", change.before.data().alias)
						.get();
				})
				.then(data => {
					data.forEach(doc => {
						const toast = db.doc(`/Toasts/${doc.id}`);
						batch.update(toast, { userImage: change.after.data().imageUrl });
					});
					return batch.commit();
				});
		} else return true;
	});

exports.onSparkExtinguish = functions.firestore
	.document("/Sparks/{sparkId}")
	.onDelete((snap, context) => {
		const sparkId = context.params.sparkId;
		const batch = db.batch();
		return db
			.collection("Stokes")
			.where("sparkId", "==", sparkId)
			.get()
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/Stokes/${doc.id}`));
				});
				return db
					.collection("/Heat")
					.where("sparkId", "==", sparkId)
					.get();
			})
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/Heat/${doc.id}`));
				});
				return db
					.collection("/Sizzles")
					.where("sparkId", "==", sparkId)
					.get();
			})
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/Sizzles/${doc.id}`));
				});
				return batch.commit();
			})
			.catch(err => console.error(err));
	});

exports.sparkToFire = functions.firestore
	.document("/Sparks/{sparkId}")
	.onUpdate(change => {
		if (
			change.before.data().heatCount !== change.after.data().heatCount &&
			change.after.data().heatCount > 99 && change.after.data().heatCount < 10000 &&
			change.before.data().fire === false
		) {
			return db
				.doc(`/Sparks/${change.before.id}`)
				.get()
				.then(doc => {
					doc.ref.update({ fire: true, infernal: false });
				})
				.catch(err => console.error(err));
		} else return;
	});

	exports.fireToInfernal = functions.firestore
	.document("/Sparks/{sparkId}")
	.onUpdate(change => {
		if (
			change.before.data().heatCount !== change.after.data().heatCount &&
			change.after.data().heatCount > 9999 &&
			change.before.data().infernal === false
		) {
			return db
				.doc(`/Sparks/${change.before.id}`)
				.get()
				.then(doc => {
					doc.ref.update({ fire: false, infernal: true });
				})
				.catch(err => console.error(err));
		} else return;
	});

exports.snuffOutFire = functions.firestore
	.document("/Sparks/{id}")
	.onUpdate(change => {
		if (
			change.before.data().heatCount !== change.after.data().heatCount &&
			change.after.data().heatCount < 1 &&
			change.before.data().fire === true
		) {
			return db
				.doc(`/Sparks/${change.before.id}`)
				.delete()
				.catch(err => console.log(err));
		} else return;
	});

exports.onOkelistErase = functions.firestore
	.document("Okelists/{id}")
	.onDelete(snap => {
		return db
			.doc(`/Songs/${snap.data().okeId}`)
			.delete()
			.catch(err => console.error(err));
	});

exports.onBoozulaEmpty = functions.firestore
	.document("/Boozulas/{boozId}")
	.onDelete((snap, context) => {
		const boozId = context.params.boozId;
		const batch = db.batch();
		return db
			.collection("Toasts")
			.where("boozId", "==", boozId)
			.get()
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/Toasts/${doc.id}`));
				});
				return db
					.collection("/Cheers")
					.where("boozId", "==", boozId)
					.get();
			})
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/Cheers/${doc.id}`));
				});
				return db
					.collection("/Clinks")
					.where("boozId", "==", boozId)
					.get();
			})
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/Clinks/${doc.id}`));
				});
				return batch.commit();
			})
			.catch(err => console.error(err));
	});

exports.removeHowlCount = functions.firestore
	.document("/Howlings/{id}")
	.onDelete(snap => {
		return db
			.doc(`/Howls/${snap.data().docKey}`)
			.get()
			.then(doc => {
				doc.ref.update({ howlCount: doc.data().howlCount - 1 });
			})
			.catch(err => console.log(err));
	});

exports.onHowlSilence = functions.firestore
	.document("/Howls/{id}")
	.onDelete(snap => {
		db.collection("Howlings")
			.where("docKey", "==", snap.data().docKey)
			.get()
			.then(data => {
				data.forEach(doc => {
					doc.ref.delete();
				});
			})
			.catch(err => console.log(err));
	});
