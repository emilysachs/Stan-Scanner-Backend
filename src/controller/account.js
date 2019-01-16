import mongoose from 'mongoose';
import { Router } from 'express';
import Account from '../model/account';
import bodyParser from 'body-parser';
import passport from '../passport';
import config from '../config';

import { generateAccessToken, respond, authenticate } from '../middleware/authMiddleware';

export default ({config, db}) => {
  let api = Router();

  api.get('/test', (req, res) => {
    res.json({message: "testing 123"});
  })

  // '/v1/account'
  api.post('/register', (req, res) => {
    Account.register(new Account({
      username: req.body.username,
      last_known_location: req.body.last_known_location,
      password: req.body.password
      // fandoms: req.body.fandoms,
      // twitter: req.body.twitter,
      // instagram: req.body.instagram
    }), req.body.password, function(err, account) {
      if (err) {
        res.send(err);
      }

      passport.authenticate(
        'local', {
          session: true // mobile or web ?
        })(req, res, () => {
          res.status(200).send({
            success: true,
            message: 'Successfully created new account'
          });
        });
    });
  });

// '/v1/account/login'
api.post('/login',
function (req, res, next) {
        console.log('routes/user.js, login, req.body: ');
        //console.log(req.body)
        next()
    },
  passport.authenticate('local'),
  generateAccessToken,
  respond
)

api.get('/', (req, res, next) => {
    console.log('===== user check!!======')
    console.log(req.user)
    if (req.user) {
      res.json({ user: req.user })
    } else {
      res.json({ user: null })
    }
})

api.get('/data', (req, res, next) => {
    console.log('===== user get!!======')
    console.log(req.user)
    if (req.user) {
      Account.findById(req.user._id, (err, user) => {
        if(err){
          res.send(err);
        }
        console.log("found");
        console.log(user);
        res.json(user);
      })

    } else {
        res.json({ user: null })
    }
})


// '/v1/account/:id' - Update
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

// '/v1/account/:id' - Update
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


// '/v1/account/logout'
api.get('/logout', authenticate, (req, res) => {
  res.logout();
  res.status(200).send('succesfully logged out');
});

// '/v1/'
api.get('/me/:dist?', (req, res) => {
  // res.status(200).json(req.user);
  console.log("user");
  console.log(req.user);
  console.log("user id");
  console.log(req.user._id);
  res.redirect(REACT_APP_API_URL + '/v1/account/load/' + req.user._id + "/" + req.params.dist);

});

api.post('/logout', (req, res) => {
  if (req.user) {
       req.logout()
       res.send({ msg: 'logging out' })
   } else {
       res.send({ msg: 'no user to log out' })
   }
});



api.get('/load/:id/:dist?', (req,res) => {
  Account.findById(req.params.id, (err, user) => {
    if(err){
      res.send(err);
    }
    var userObj = encodeURIComponent(JSON.stringify(user));
    res.redirect(REACT_APP_API_URL + '/v1/account/nearby/' + userObj + "/" + req.params.dist);
  })
})

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
})

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
  })
})


// '/v1/account/nearby/:dist'
api.get('/nearby/:user/:dist?', (req, res) => {
    var userObj = JSON.parse(decodeURIComponent(req.params.user));
    var fandoms = userObj.fandoms;
    var approved = userObj.approved;
    var last_known_location = userObj.last_known_location;
    var dist = 160.9344;
    if(req.params.dist != 'undefined'){
      dist = req.params.dist;
    }
    Account.find(
      {last_known_location: {$nearSphere: {$geometry: last_known_location, $maxDistance: dist * 1000}}, // maxDistance roughly miles
        fandoms: {$in: fandoms}},
      (err, users) => {
      if(err){
        throw err;
      }

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

      for (let fan of users){
        var mut1 = false;
        var mut2 = false;
        if(fan.approved.includes(userObj._id.toString())){
          mut1 = true;
        }
        if(userObj.approved.includes(fan._id.toString())){
          mut2 = true;
        }
        fan.following = mut2;
        fan.mutuals = mut1 && mut2;
        var distance = Math.round(haversineDistance(userObj.last_known_location.coordinates[1], userObj.last_known_location.coordinates[0], fan.last_known_location.coordinates[1], fan.last_known_location.coordinates[0]) / 1000 * 0.62137119);
        fan.distance = distance;
        fan.last_known_location = null;
        console.log(fan);
      }
      res.send(users);

    });
});

api.get('/auth/twitter',
  passport.authenticate('twitter'));

api.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log("successful auth");
    res.redirect(process.env.REACT_APP_URL);
  });

  return api;
}
