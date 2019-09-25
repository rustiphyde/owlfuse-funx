const { admin, db } = require("../util/admin");
const config = require('../util/config');

const firebase = require("firebase");
firebase.initializeApp(config);

// Sign up for an Owlfuse account
exports.signup = (req, res) => {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      clozang: req.body.clozang
    };

    let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Field must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) {
    errors.password = "Field must not be empty";
  }

  if (newUser.confirmPassword !== newUser.password) {
    errors.confirmPassword = "Password fields must match";
  }

  if (isEmpty(newUser.clozang)) {
    errors.clozang = "Field must not be empty";
  }

  if (Object.keys(errors).length > 0) {
    return status(400).json(errors);
  }

    let token, userId;
    db.doc(`/Users/${newUser.clozang}`)
      .get()
      .then(doc => {
        if (doc.exists) {
          return res
            .status(400)
            .json({ clozang: "This clozang has already been lit by someone else" });
        } else {
          return firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
      })
      .then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
      })
      .then(idToken => {
        token = idToken;
        const userCredentials = {
          clozang: newUser.clozang,
          email: newUser.email,
          createdAt: new Date().toISOString(),
          userId
        };
        return db.doc(`/Users/${newUser.clozang}`).set(userCredentials);
      })
      .then(() => {
        return res.status(201).json({ token });
      })
      .catch(err => {
        console.error(err);
        if (err.code === "auth/email-already-in-use") {
          return res.status(400).json({ email: "Email is already in use" });
        } else {
          return res
            .status(500)
            .json({ general: "Something went wrong, please try again" });
        }
      });
  };

  //Login to Owlfuse
  exports.login = (req, res) => {
    const user = {
      email: req.body.email,
      password: req.body.password
    };

    let errors = {};

  if (isEmpty(user.email)) {
    errors.email = "Field must not be empty";
  }
  if (isEmpty(user.password)) {
    errors.password = "Field must not be empty";
  }
  if (Object.keys(errors).length > 0) {
    return status(400).json(errors);
  }

    firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password)
      .then(data => {
        return data.user.getIdToken();
      })
      .then(token => {
        return res.status(201).json({ token });
      })
      .catch(err => {
        console.error(err);
        return res
          .status(403)
          .json({ general: "Wrong credentials, please try again" });
      });
  }