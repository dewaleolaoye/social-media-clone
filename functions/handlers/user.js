const { db, admin } = require('../util/admin');
const firebase = require('firebase');

const config = require('../util/config');
firebase.initializeApp(config);

const {
  validateSignUpData,
  validateLoginData,
  reduceUserDetails
} = require('../util/validators');

// Signup
exports.signUp = (req, res) => {
  const { email, password, confirmPassword, userHandle } = req.body;

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

  const noImg = 'no-img.png';
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
            imgageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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

// login
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

// upload users profile image
exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    // console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file type submitted' });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on('finish', () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.userHandle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'image uploaded successfully' });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: 'something went wrong' });
      });
  });
  busboy.end(req.rawBody);
};

// add user details
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.userHandle}`)
    .update(userDetails)
    .then(() => {
      return res
        .status(200)
        .json({
          message: 'Details added successfully'
        })
        .catch(err => {
          console.log('the error is here', err);
          return res.status(500).json({
            error: err.code
          });
        });
    });
};
