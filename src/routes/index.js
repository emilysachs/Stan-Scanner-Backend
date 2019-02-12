import express from 'express';
import config from '../config';
import middleware from '../middleware';
import initializeDb from '../db';
import followers from '../controller/followers';
import following from '../controller/following';
import account from '../controller/account';

let router = express();

//connect to db
initializeDb(db => {
  router.use(function(req, res, next) {
    console.log("pre middleware");
    console.log(process.env.NODE_ENV);
    console.log(process.env.REACT_APP_API_URL +'/v1/account/auth/twitter/callback');
    next();
  });

  // middleware
  router.use(middleware({config, db}));

  router.use(function(req, res, next) {
    console.log("made it through middleware");
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
  });


  //routes
  router.use('/followers', followers({config, db}));
  router.use('/following', following({config, db}));
  router.use('/account', account({config, db}));
});

export default router;
