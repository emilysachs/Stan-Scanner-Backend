const passport = require('passport')
const LocalStrategy = require('./localStrategy')
const Account = require('../model/account')
const TwitterStrategy = require('passport-twitter').Strategy;
import urls from '../urls.js';
import twitterApi from '../twitterApi.js';

// called on login, saves the id to session req.session.passport.user = {id:'..'}
passport.serializeUser((user, done) => {
	console.log('*** serializeUser called, user: ')
	console.log(user) // the whole raw user object!
	console.log('---------')
	done(null, { _id: user._id })
})

// user object attaches to the request as req.user
passport.deserializeUser((id, done) => {
	console.log('DeserializeUser called')
	Account.findOne(
		{ _id: id },
		'username',
		(err, user) => {
			console.log('*** Deserialize user, user:')
			console.log(user)
			console.log('--------------')
			done(null, user)
		}
	)
})

//  Use Strategies
passport.use(LocalStrategy);
passport.use(new TwitterStrategy({
    consumerKey: twitterApi.consumerKey,
    consumerSecret: twitterApi.consumerSecret,
    callbackURL: urls.appCallback 
  },
  function(token, tokenSecret, profile, cb) {
		console.log('Twitter profile');
		console.log(typeof process.env.REACT_APP_CALLBACK);
		console.log(profile);
		Account.findOne({username: profile.id}, (err, account) => {
			if(err){
				res.send(err);
			} else if (account) {
				if(account.twitter != profile.username){
					account.twitter = profile.username;
					account.save(err => {
			      if (err) {
			        res.send(err);
			      }
			      res.json({message: "user twitter updated", twitter: account.twitter});
			    });
				}
				return cb(err, account);
			} else {
				const newAccount = new Account({
					username: profile.id,
				    last_known_location : {
				        type : "Point",
				        coordinates : [
				            0,
				            0
				        ]
					},
					twitter: profile.username,
					display_name: 'anon'
				})
				newAccount.save((err, savedAccount) => {
					if (err){
						res.send(err)
					}
					console.log('savedAccount!!!!!!!');
					console.log(savedAccount);
					return cb(err, savedAccount);
				})
			}
		})
  }
));


module.exports = passport
