import express from 'express';
import config from '../config';
import middleware from '../middleware';
import initializeDb from '../db';
import account from '../controller/account';
import urls from '../urls.js';

let router = express();

// connect to db
initializeDb(db => {
  router.use(function(req, res, next) {
    console.log('pre middleware');
    console.log(process.env.NODE_ENV);
    console.log(urls.apiUrl +'/v1/account/auth/twitter/callback');
    next();
  });

  // middleware
  router.use(middleware({config, db}));

  router.use(function(req, res, next) {
    console.log('made it through middleware');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
  });

  //routes
  router.use('/account', account({config, db}));
});

export default router;
