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

// Signup

app.post('/signup', (req, res) => {
  const { email, password, confirmPassword, userHandle } = req.body;
  const newUser = {
    email,
    password,
    confirmPassword,
    userHandle
  };

  firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data => {
      return res.status(201).json({
        status: 'success',
        message: `User ${data.user.uid} successfully signed up`
      });
    })
    .catch(error => {
      console.log(error);
      return res.status(500).json({
        status: 'error',
        message: `${error.message}`
      });
    });
});

exports.api = functions.https.onRequest(app);
