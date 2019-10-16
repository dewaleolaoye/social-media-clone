const { db } = require('../util/admin');
const firebase = require('firebase');

const config = require('../util/config');
firebase.initializeApp(config);

const { validateSignUpData, validateLoginData } = require('../util/validators');

exports.signUp = (req, res) => {
  const { email, password, confirmPassword, userHandle } = req.body;
  console.log('Email:', email, 'confirm:', confirmPassword);
  const newUser = {
    email,
    password,
    confirmPassword,
    userHandle
  };

  const { valid, errors } = validateSignUpData(newUser);

  if (!valid) {
    return res.status(400).json(errors);
  }

  let userId, token;
  db.doc(`/users/${userHandle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({
          status: 'error',
          message: 'User handle already exist'
        });
      }

      firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
        .then(data => {
          userId = data.user.uid;
          return data.user.getIdToken();
        })
        .then(idToken => {
          token = idToken;
          const userCredentials = {
            userHandle,
            email,
            createdAt: new Date().toISOString(),
            userId
          };

          return db.doc(`/users/${userHandle}`).set(userCredentials);
        })
        .then(() => {
          return res.status(201).json({
            message: 'Successfully signed up',
            token
          });
        })
        .catch(error => {
          console.log('The ERROR', error);
          if ((error.code = 'auth/email-already-in-use')) {
            return res.status(401).json({
              status: 'error',
              message: `Email already exist`
            });
          }
          return res.status(500).json({
            status: 'error',
            message: error.code
          });
        });
    });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const user = {
    email,
    password
  };

  const { valid, errors } = validateLoginData(user);

  if (!valid) {
    return res.status(400).json(errors);
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({
        message: 'Sign in successfully',
        token
      });
    })
    .catch(err => {
      if ((err.code = 'auth/wrong-password')) {
        return res.status(403).json({
          message: 'Wrong credentials'
        });
      }
      return res.status(500).json({
        message: err.code
      });
    });
};
