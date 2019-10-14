const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send('Hello from Social app!');
});

exports.getScreams = functions.https.onRequest((req, res) => {
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

exports.createScream = functions.https.onRequest((req, res) => {});
