const app = require('express')();
const functions = require('firebase-functions');
// const firebase = require('firebase');

// firebase.initializeApp(firebaseConfig);

// const { firebaseConfig } = require('./util/config');
const fbAuth = require('./util/fbAuth');

const { getAllScreams, postOneScream } = require('./handlers/scream');
const { signUp, login } = require('./handlers/user');

// Scream Route
app.get('/screams', getAllScreams);
app.post('/scream', fbAuth, postOneScream);

// Users Route
app.post('/signup', signUp);
app.post('/login', login);

exports.api = functions.https.onRequest(app);
