const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const app = express();

admin.initializeApp();

app.get('/screams', (req, res) => {
  admin
    .firestore()
    .collection('screams')
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

  admin
    .firestore()
    .collection('screams')
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

exports.api = functions.https.onRequest(app);
