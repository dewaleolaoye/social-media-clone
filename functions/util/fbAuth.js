const { db, admin } = require('./admin');

module.exports = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Unauthorized'
    });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      console.log(decodedToken);
      req.user = decodedToken;

      return db
        .collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.userHandle = data.docs[0].data().userHandle;
      return next();
    })
    .catch(err => {
      console.error('Error while verifying error', err);
      return res.status.json(err);
    });
};
