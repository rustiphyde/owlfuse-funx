const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./util/fbAuth");

const cors = require("cors");
app.use(cors());

const { db, admin } = require("./util/admin");

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
	unsilenceFuser,
	fetchOneFuser,
	getSilencedUserList,
} = require("./handlers/fusers");

const {
	postNewHowl,
	fetchUserHowls,
	fetchSingleHowl,
	silenceAHowl,
	editAHowl,
	fetchFuserHowls,
	increaseHowlCount,
	getHowlCount,
} = require("./handlers/howls");

const {
	getAllSparks,
	postOneSpark,
	getSpark,
	stokeSpark,
	addHeat,
	removeHeat,
	extinguishSpark,
	getOnlyHottest,
	uploadSparkImage,
	uploadSparkVideo,
	uploadSparkAudio,
	postSparkVideoLink,
} = require("./handlers/sparks");

const {
	buildNewOkeList,
	getAllOkelists,
	getOke,
	addOneSong,
	getSongsByList,
	getSongsByArtist,
	getSongsByClozang,
	choozByList,
	choozByArtist,
	choozByClozang,
	choozFromAllSongs,
	eraseOkelist,
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
	emptyBoozula,
} = require("./handlers/boozulas");

const {
	signup,
	login,
	uploadImage,
	addUserDetails,
	getAuthenticatedUser,
	getUserDetails,
	markSizzlesRead,
	resetPassword,
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
app.post("/image/spark", FBAuth, uploadSparkImage);
app.post("/video/spark", FBAuth, uploadSparkVideo);
app.post("/audio/spark", FBAuth, uploadSparkAudio);
app.post("/video/link/:sparkId", FBAuth, postSparkVideoLink);
// Fuser routes
app.get("/fusers", FBAuth, getUserFuserList);
app.get("/fuse-with/:fuser", FBAuth, sendFuseRequest);
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
app.get("/fused/:fuser", FBAuth, fetchOneFuser);
app.get("silencedUser", FBAuth, getSilencedUserList);
// Howl routes
app.post("/howl/:friend", FBAuth, postNewHowl);
app.get("/howls", FBAuth, fetchUserHowls);
app.get("/howl/:docKey", FBAuth, fetchSingleHowl);
app.delete("/howl/:howlId", FBAuth, silenceAHowl);
app.post("/howl/edit/:howlId", FBAuth, editAHowl);
app.get("/howls/:fuser", FBAuth, fetchFuserHowls);
app.get("/count/:docKey", FBAuth, getHowlCount);
app.get("/addCount/:docKey", FBAuth, increaseHowlCount);
// User routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.post("/sizzles", FBAuth, markSizzlesRead);
app.get("/user/:clozang", getUserDetails);
app.post("/reset", resetPassword);

// Oke routes
app.post("/okelist", FBAuth, buildNewOkeList);
app.get("/okelists", getAllOkelists);
app.get("/okelist/:okeId", getOke);
app.post("/okelist/:okeId/song", FBAuth, addOneSong);
app.get("/songs/:okeId/list", getSongsByList);
app.get("/songs/:artist/artist", getSongsByArtist);
app.get("/songs/:clozang/clozang", getSongsByClozang);
app.get("/song/:okeId/list/chooz", choozByList);
app.get("/song/:artist/artist/chooz", choozByArtist);
app.get("/song/:clozang/clozang/chooz", choozByClozang);
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
	.onCreate((snap) => {
		return db
			.doc(`/Sparks/${snap.data().sparkId}`)
			.get()
			.then((doc) => {
				if (doc.exists && doc.data().userClozang !== snap.data().userClozang) {
					return db.doc(`/Sizzles/${snap.data().sparkId}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userClozang,
						sender: snap.data().userClozang,
						type: "heat",
						read: false,
						sizzleId: snap.data().sparkId,
					});
				}
			})
			.catch((err) => console.error(err));
	});

exports.createSizzleOnCheers = functions.firestore
	.document("Cheers/{id}")
	.onCreate((snap) => {
		return db
			.doc(`/Boozulas/${snap.data().boozId}`)
			.get()
			.then((doc) => {
				if (doc.exists && doc.data().userClozang !== snap.data().userClozang) {
					return db.doc(`/Sizzles/${snap.data().boozId}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userClozang,
						sender: snap.data().userClozang,
						type: "cheers",
						read: false,
						sizzleId: snap.data().boozId,
					});
				}
			})
			.catch((err) => console.error(err));
	});

exports.createSizzleOnStoke = functions.firestore
	.document("Stokes/{id}")
	.onCreate((snap) => {
		return db
			.doc(`/Sparks/${snap.data().sparkId}`)
			.get()
			.then((doc) => {
				if (doc.exists && doc.data().userClozang !== snap.data().userClozang) {
					return db.doc(`/Sizzles/${snap.data().sparkId}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userClozang,
						sender: snap.data().userClozang,
						type: "stoke",
						read: false,
						sizzleId: snap.data().sparkId,
					});
				}
			})
			.catch((err) => console.error(err));
	});

exports.createSizzleOnToast = functions.firestore
	.document("Toasts/{id}")
	.onCreate((snap) => {
		return db
			.doc(`/Boozulas/${snap.data().boozId}`)
			.get()
			.then((doc) => {
				if (doc.exists && doc.data().userClozang !== snap.data().userClozang) {
					return db.doc(`/Sizzles/${snap.data().boozId}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userClozang,
						sender: snap.data().userClozang,
						type: "toast",
						read: false,
						sizzleId: snap.data().boozId,
					});
				}
			})
			.catch((err) => console.error(err));
	});

exports.createSizzleOnRequest = functions.firestore
	.document("Requests/{id}")
	.onCreate((snap) => {
		return db
			.doc(`/Sizzles/${snap.id}`)
			.set({
				createdAt: new Date().toISOString(),
				recipient: snap.data().requested,
				sender: snap.data().sender,
				type: "request",
				read: false,
				sizzleId: snap.id,
			})
			.catch((err) => console.error(err));
	});

exports.removeHeatSizzle = functions.firestore
	.document("Heat/{id}")
	.onDelete((snap) => {
		return db
			.doc(`/Sizzles/${snap.data().sparkId}`)
			.delete()
			.catch((err) => console.error(err));
	});

exports.removeCheersSizzle = functions.firestore
	.document("Cheers/{id}")
	.onDelete((snap) => {
		return db
			.doc(`/Sizzles/${snap.data().boozId}`)
			.delete()
			.catch((err) => console.error(err));
	});

exports.onUserImageChange = functions.firestore
	.document("/Users/{Id}")
	.onUpdate((change) => {
		if (change.before.data().imageUrl !== change.after.data().imageUrl) {
			const batch = db.batch();
			return db
				.collection("Sparks")
				.where("userClozang", "==", change.before.data().clozang)
				.get()
				.then((data) => {
					data.forEach((doc) => {
						const spark = db.doc(`/Sparks/${doc.id}`);
						batch.update(spark, { userImage: change.after.data().imageUrl });
					});
					return db
						.collection("Stokes")
						.where("userClozang", "==", change.before.data().clozang)
						.get();
				})
				.then((data) => {
					data.forEach((doc) => {
						const stoke = db.doc(`/Stokes/${doc.id}`);
						batch.update(stoke, { userImage: change.after.data().imageUrl });
					});
					return db
						.collection("Toasts")
						.where("userClozang", "==", change.before.data().clozang)
						.get();
				})
				.then((data) => {
					data.forEach((doc) => {
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
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/Stokes/${doc.id}`));
				});
				return db.collection("/Heat").where("sparkId", "==", sparkId).get();
			})
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/Heat/${doc.id}`));
				});
				return db.collection("/Sizzles").where("sparkId", "==", sparkId).get();
			})
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/Sizzles/${doc.id}`));
				});
				return batch.commit();
			})
			.catch((err) => console.error(err));
	});

exports.sparkToFire = functions.firestore
	.document("/Sparks/{sparkId}")
	.onUpdate((change) => {
		if (
			change.before.data().heatCount !== change.after.data().heatCount &&
			change.after.data().heatCount > 99 &&
			change.after.data().heatCount < 10000 &&
			change.before.data().fire === false
		) {
			return db
				.doc(`/Sparks/${change.before.id}`)
				.get()
				.then((doc) => {
					doc.ref.update({ fire: true, infernal: false });
					return db.doc(`/Sizzles/change.before.id`).set({
						createdAt: new Date().toISOString(),
						recipient: change.before.data().userClozang,
						sender: "",
						type: "fire",
						read: false,
						sizzleId: change.before.id,
					});
				})
				.catch((err) => console.error(err));
		} else return;
	});

exports.fireToInfernal = functions.firestore
	.document("/Sparks/{sparkId}")
	.onUpdate((change) => {
		if (
			change.before.data().heatCount !== change.after.data().heatCount &&
			change.after.data().heatCount > 9999 &&
			change.before.data().infernal === false
		) {
			return db
				.doc(`/Sparks/${change.before.id}`)
				.get()
				.then((doc) => {
					doc.ref.update({ fire: false, infernal: true });
					return db.doc(`/Sizzles/change.before.id`).set({
						createdAt: new Date().toISOString(),
						recipient: change.before.data().userClozang,
						sender: "",
						type: "infernal",
						read: false,
						sizzleId: change.before.id,
					});
				})
				.catch((err) => console.error(err));
		} else return;
	});

exports.snuffOutFire = functions.firestore
	.document("/Sparks/{id}")
	.onUpdate((change) => {
		if (
			change.before.data().heatCount !== change.after.data().heatCount &&
			change.after.data().heatCount < 1 &&
			change.before.data().fire === true
		) {
			return db
				.doc(`/Sparks/${change.before.id}`)
				.delete()
				.then(() => {
					return db.doc(`/Sizzles/change.before.id`).set({
						createdAt: new Date().toISOString(),
						recipient: change.before.data().userClozang,
						sender: "",
						type: "snuff",
						read: false,
						sizzleId: change.before.id,
					});
				})
				.catch((err) => console.log(err));
		} else return;
	});

exports.onOkelistErase = functions.firestore
	.document("Okelists/{id}")
	.onDelete((snap) => {
		return db
			.doc(`/Songs/${snap.data().okeId}`)
			.delete()
			.catch((err) => console.error(err));
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
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/Toasts/${doc.id}`));
				});
				return db.collection("/Cheers").where("boozId", "==", boozId).get();
			})
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/Cheers/${doc.id}`));
				});
				return db.collection("/Sizzles").where("sizzleId", "==", boozId).get();
			})
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/Sizzles/${doc.id}`));
				});
				return batch.commit();
			})
			.catch((err) => console.error(err));
	});

exports.removeAcceptedRequest = functions.firestore
	.document("/Requests/{id}")
	.onUpdate((change) => {
		if (change.after.data().accepted === true) {
			db.doc(`/Sizzles/${change.before.id}`)
				.set({
					createdAt: new Date().toISOString(),
					recipient: change.before.data().sender,
					sender: change.before.data().requested,
					type: "accept",
					read: false,
					sizzleId: change.before.id,
				})
				.then(() => {
					return db.doc(`/Requests/${change.before.id}`).delete();
				})
				.catch((err) => console.log(err));
		} else return;
	});

exports.removeRejectedRequest = functions.firestore
	.document("/Requests/{id}")
	.onUpdate((change) => {
		if (change.after.data().rejected === true) {
			db.doc(`/Sizzles/${change.before.id}`)
				.set({
					createdAt: new Date().toISOString(),
					recipient: change.before.data().sender,
					sender: change.before.data().requested,
					type: "reject",
					read: false,
					sizzleId: change.before.id,
				})
				.then(() => {
					return db.doc(`/Requests/${change.before.id}`).delete();
				})
				.catch((err) => console.log(err));
		} else return;
	});

exports.decreaseHowlCount = functions.firestore
	.document("/Howls/{id}")
	.onDelete((snap) => {
		return db
			.collection("HowlCounts")
			.where("docKey", "==", snap.data().docKey)
			.get()
			.then((data) => {
				data.forEach((doc) => {
					if (doc.data().howlCount > 0) {
						doc.ref.update({ howlCount: doc.data().howlCount - 1 });
					} else return doc.data();
				});
			})
			.catch((err) => console.log(err.code));
	});

exports.removeAttachedMedia = functions.firestore
	.document("/Sparks/{id}")
	.onDelete((snap) => {
		const bucket = admin.storage().bucket();
		let splitter = "";
		if(snap.data().embered !== true){
			if (snap.data().sparkImage !== "") {
				splitter = snap.data().sparkImage.split("/")[7].split("?")[0];
			} else if (snap.data().sparkVideo !== ""){
				splitter = snap.data().sparkVideo.split("/")[7].split("?")[0];
			} else if (snap.data().sparkAudio !== ""){
				splitter = snap.data().sparkAudio.split("/")[7].split("?")[0];
			} 
			bucket
					.file(`${splitter}`)
					.delete()
					.then(function () {
						console.log("Media Removed Successfully!");
					})
					.catch((err) => console.log(err.code));
		}

	});
