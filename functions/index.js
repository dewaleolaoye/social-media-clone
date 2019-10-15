const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const firebase = require('firebase');

const app = express();

admin.initializeApp();
const db = admin.firestore();

const { firebaseConfig } = require('./config');
firebase.initializeApp(firebaseConfig);

app.get('/screams', (req, res) => {
  db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      const screams = [];
      data.forEach(doc => {
        screams.push({
          screamsId: doc.id,
          ...doc.data()
        });
      });

      return res.status(200).json(screams);
    })
    .catch(error => {
      console.error(error);
    });
});

app.post('/scream', (req, res) => {
  const { body, userHandle } = req.body;
  const newScream = {
    body,
    userHandle,
    createdAt: new Date().toISOString()
  };

  db.collection('screams')
    .add(newScream)
    .then(doc => {
      return res.status(201).json({
        status: 'success',
        message: `document ${doc.id} created successfully`
      });
    })
    .catch(error => {
      res.status(500).json({
        error: 'something went wrong'
      });
      console.log('the error is here', error);
    });
});
/**
 * TODO: Move this to another file
 */

// Helper Function
const isEmail = email => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = string => {
  if (string.trim() === '') return true;
  else return false;
};

// Signup
app.post('/signup', (req, res) => {
  const { email, password, confirmPassword, userHandle } = req.body;
  const newUser = {
    email,
    password,
    confirmPassword,
    userHandle
  };

  /**
   * TODO: I will refactor everything to better standard
   *! where I wiill refactor and seperate concerns
   ** REPETITION OF CODE
   */
  // Validations
  let errors = {};

  if (isEmpty(email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(email)) {
    errors.email = 'Must be a valid email address';
  }

  if (isEmpty(password)) errors.password = 'Must not be empty';

  if (password !== confirmPassword)
    errors.confirmPassword = 'Password must match';

  if (isEmpty(userHandle)) errors.userHandle = 'Must not be empty';

  if (Object.keys(errors).length > 0) {
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
});

exports.api = functions.https.onRequest(app);
