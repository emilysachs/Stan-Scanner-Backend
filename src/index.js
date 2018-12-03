import http from 'http';
import express from 'express';
import session from 'express-session';

import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import passport from './passport';
const LocalStrategy = require('passport-local').Strategy;

import config from './config';
import routes from './routes';

let app = express();
app.server = http.createServer(app);

// middleware
// parse application/json
app.use(
  session({
    secret: 'i-luv-bts', //pick a random string to make the hash that is generated secure
    resave: false, //required
    saveUninitialized: false //required
  })
)
app.use( (req, res, next) => {
  console.log('req.session', req.session);
  console.log('req.token', req.token);
  next()
});
app.use(bodyParser.json({
  limit: config.bodyLimit
}));

// passport config
app.use(passport.initialize());
app.use(passport.session());
// let Account = require('./model/account');
// passport.use(new LocalStrategy(
//   Account.authenticate()
// ));
// passport.serializeUser(Account.serializeUser());
// passport.deserializeUser(Account.deserializeUser());


//api routes v1
app.use('/v1', routes);

app.server.listen(config.port);
console.log(`Started on port ${app.server.address().port}`);

export default app;
