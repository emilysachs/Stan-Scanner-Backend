import mongoose from 'mongoose';
import Account from './account';
let Schema = mongoose.Schema;

let followingSchema = new Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Following', followingSchema);
