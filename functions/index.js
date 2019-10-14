const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const app = express();

admin.initializeApp();

app.get('/screams', (req, res) => {
  admin
    .firestore()
    .collection('screams')
    .get()
    .then(data => {
      const screams = [];
      data.forEach(doc => {
        screams.push(doc.data());
      });

      return res.status(200).json(screams);
    })
    .catch(error => {
      console.error(error);
    });
});

app.post('/createScream', (req, res) => {
  // const { body, userHandle } = req.body;
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
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

// exports.createScream = functions.https.onRequest((req, res) => {
// });

exports.api = functions.https.onRequest(app);
