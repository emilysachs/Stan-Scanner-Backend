import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import passportLocalMongoose from 'passport-local-mongoose';

let Account = new Schema({
  username: String,
  password: String,
  last_known_location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  display_name: String,
  fandoms: Array,
  distance: String,
  twitter: String,
  approved: Array,
  following: Boolean,
  mutuals: Boolean
});

Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);
