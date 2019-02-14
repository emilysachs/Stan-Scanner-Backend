import mongoose from 'mongoose';
import { Router } from 'express';
import Account from '../model/account';
import bodyParser from 'body-parser';
import passport from '../passport';
import config from '../config';
import urls from '../urls.js';

import { generateAccessToken, respond, authenticate } from '../middleware/authMiddleware';

export default ({config, db}) => {
  let api = Router();

  // '/v1/account/' - check if user is logged in (saved  session)
  api.get('/', (req, res, next) => {
    console.log('===== user check!!======');
    console.log(req.user);
    if (req.user) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });

  // '/v1/account/auth/twitter' - sign in with twitter
  api.get('/auth/twitter',
    passport.authenticate('twitter'));

  // '/v1/account/auth/twitter/callback' - callback from twitter
  api.get('/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
      // successful authentication, redirect home.
      console.log('successful auth');
      res.redirect(urls.appUrl); 
    });

  // '/v1/account/logout' - logout user from session
  api.post('/logout', (req, res) => {
    if (req.user) {
      req.logout()
      res.send({ msg: 'logging out' });
    } else {
      res.send({ msg: 'no user to log out' });
    }
  });

  // '/v1/account/data' - get user data 
  api.get('/data', (req, res, next) => {
      console.log('===== user get!!======');
      console.log(req.user);
      if (req.user) {
        Account.findById(req.user._id, (err, user) => {
          if(err){
            res.send(err);
          }
          console.log('found');
          console.log(user);
          res.json(user);
        });

      } else {
          res.json({ user: null });
      }
  });

  // '/v1/account/addFandom/:fandom' - add fandom to user's list of fandoms
  api.put('/addFandom/:fandom', (req, res) => {
    Account.findById(req.user._id, (err, user) => {
      if (err) {
        res.send(err);
      }
      console.log(user);
      user.fandoms.push(req.params.fandom);
      user.save(err => {
        if (err) {
          res.send(err);
        }
        res.json({message: "user info updated", fandoms: user.fandoms});
      });
    });
  });

  // '/v1/account/removeFandom/:fandom' - remove fandom from user's list of fandoms
  api.put('/removeFandom/:fandom', (req, res) => {
    Account.findById(req.user._id, (err, user) => {
      if (err) {
        // res.send(err);
      }
      console.log(user);
      var found = user.fandoms.indexOf(req.params.fandom);
      user.fandoms.splice(found, 1);
      user.save(err => {
        if (err) {
          res.send(err);
        } else {
          res.json({message: "user info updated", fandoms: user.fandoms});
        }
      });
    });
  });

  // '/v1/account/updateDisplayName' - update user's display name
  api.post('/updateDisplayName', (req, res) => {
    Account.findById(req.user._id, (err, user) => {
      if (err) {
        res.send(err);
      }
      console.log(user);
      user.display_name = req.body.name;
      user.save(err => {
        if (err) {
          res.send(err);
        }
        res.json({message: "user display name updated", name: user.display_name});
      });
    });
  });

  // '/v1/account/updateLocation/:latitude/:longitude' - update user's location 
  api.put('/updateLocation/:latitude/:longitude', (req, res) => {
    Account.findById(req.user._id, (err, user) => {
      if (err) {
        res.send(err);
      }
      console.log(user);
      var newCoords = {
          "type" : "Point",
          "coordinates" : [
              req.params.longitude,
              req.params.latitude
          ]
      };
      user.last_known_location = newCoords;
      user.save(err => {
        if (err) {
          res.send(err);
        }
        res.json({message: "user info updated", coordinates: user.last_known_location});
      });
    });
  });

  // '/v1/account/sayHi/:id' - provide twitter username for link once both users are mutuals
  api.get('/sayHi/:id', (req,res) => {
    if (req.user){
      Account.findById(req.params.id, (err, user) => {
        if(err){
          res.send(err);
        }
        console.log(user);
        res.send({twitter: user.twitter});
      });
    } else {
      res.send({twitter: ''});
    }
  });

  // '/v1/account/approve/:username' - add other user to list of current user's approved friends
  api.get('/approve/:username', (req,res) => {
    Account.findById(req.user._id, (err, user) => {
      if(err){
        res.send(err);
      }
      console.log(user);
      Account.findOne({username: req.params.username}, (err, otherUser) => {
        user.approved.push(otherUser._id.toString());
        user.save(err => {
          if (err) {
            res.send(err);
          }
          res.json({message: "user approved updated", user: user});
        });
      });
    });
  });

  // '/v1/account/reject/:username' - remove other user from list of current user's approved friends
  api.get('/reject/:username', (req,res) => {
    Account.findById(req.user._id, (err, user) => {
      if(err){
        res.send(err);
      }
      console.log(user);
      Account.findOne({username: req.params.username}, (err, otherUser) => {
        var found = user.approved.indexOf(otherUser._id.toString());
        user.approved.splice(found, 1);
        user.save(err => {
          if (err) {
            res.send(err);
          }
          res.json({message: "user approved updated", user: user});
        });
      });
    });
  });


  // Main api calls for getting nearby users with similar fandoms, need to research better ways to implement

  // '/v1/account/me/:dist?' - get user id from session and forward to next database call, option distance parameter
  api.get('/me/:dist?', (req, res) => {
    // res.status(200).json(req.user);
    console.log('user');
    console.log(req.user);
    console.log('user id');
    console.log(req.user._id);
    res.redirect(urls.apiUrl + '/v1/account/load/' + req.user._id + '/' + req.params.dist); 

  });

  // '/v1/account/load/:id/:dist? - find user account by id in database and forward to next database call, optional distance parameter
  api.get('/load/:id/:dist?', (req,res) => {
    Account.findById(req.params.id, (err, user) => {
      if(err){
        res.send(err);
      }
      var userObj = encodeURIComponent(JSON.stringify(user));
      res.redirect(urls.apiUrl + '/v1/account/nearby/' + userObj + '/' + req.params.dist); 
    });
  });

  // '/v1/account/nearby/:user/:dist' - find nearby users with similar fandoms
  api.get('/nearby/:user/:dist?', (req, res) => {
      var userObj = JSON.parse(decodeURIComponent(req.params.user));
      var fandoms = userObj.fandoms;
      var approved = userObj.approved;
      var last_known_location = userObj.last_known_location;
      var dist = 160.9344; // default search radius if not specified
      if(req.params.dist != 'undefined'){
        dist = req.params.dist;
      }
      // get all users in database within search radius from user's location that have at least one fandom in common
      Account.find(
        {last_known_location: {$nearSphere: {$geometry: last_known_location, $maxDistance: dist * 1000}}, // maxDistance roughly miles
          fandoms: {$in: fandoms}},
        (err, users) => {
        if(err){
          throw err;
        }

        // calculate distance in meters between 2 sets of coordinates 
        function haversineDistance(lat1, lon1, lat2, lon2) {
          function toRad(x) {
            return x * Math.PI / 180;
          }
          var R = 6371; // km
          var x1 = lat2 - lat1;
          var dLat = toRad(x1);
          var x2 = lon2 - lon1;
          var dLon = toRad(x2)
          var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          var d = R * c * 1000;
          return d;
        }

        // modify array of users for result
        for (let fan of users){
          // check relationships between all users, need to research whether this can be optimized using different schema
          var mutual1 = false;
          var mutual2 = false;
          if(fan.approved.includes(userObj._id.toString())){
            mutual1 = true;
          }
          if(userObj.approved.includes(fan._id.toString())){
            mutual2 = true;
          }
          fan.following = mutual2;
          fan.mutuals = mutual1 && mutual2;

          // convert distance to miles
          var distance = Math.round(haversineDistance(userObj.last_known_location.coordinates[1], userObj.last_known_location.coordinates[0], fan.last_known_location.coordinates[1], fan.last_known_location.coordinates[0]) / 1000 * 0.62137119);
          fan.distance = distance;

          // obscure user's actual location and twitter username before sending data back to the client
          fan.last_known_location = null;
          fan.twitter = null;
          console.log(fan);
        }
        res.send(users);

      });

    });

  return api;
}
