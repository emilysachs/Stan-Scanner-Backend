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
  fandoms: Array,
  distance: String,
  twitter: String,
  approved: [{ type: Schema.Types.ObjectId, ref: 'Account' }]
});

Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);
