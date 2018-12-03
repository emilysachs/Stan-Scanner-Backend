import mongoose from 'mongoose';
import { Router } from 'express';
import Followers from '../model/followers';

import { authenticate } from '../middleware/authMiddleware';

export default({config, db}) => {
  let api = Router();

  // '/v1/followers/add' - Create
  api.post('/add', (req, res) => {
    let followers = new Followers();
    followers.from = req.body.from;
    followers.to = req.body.to;
    followers.save(err => {
      if(err){
        res.send(err);
      }
      res.json({message: 'Followers record saved succesfully'});
    });
  });

  // '/v1/followers/:from' - Read
  api.get('/:from', (req, res) => {
    Followers.find(req.body.from, (err, allFollowers) => {
      if(err){
        res.send(err);
      }
      res.json(allFollowers);
    });
  });

  // '/v1/followers/:from/:to' - Read
  api.get('/:from/:to', (req, res) => {
    Followers.find({from: req.params.from, to: req.params.to}, (err, following) => {
      if (err) {
        res.send(err);
      }
      console.log(following);
      if(following.length > 0){
        res.json({follower: true, message: "Follower record exists"});
      } else {
        res.json({follower: false, message: "Follower record does not exist"});
      }
    });
  });

  // '/v1/followers/:from/:to' - Delete
  api.delete('/:from/:to', (req, res) => {
    Followers.remove({from: req.body.from, to: req.body.to}, (err, followers) => {
      if (err) {
        res.send(err);
      }
      res.json({message: "Follower record successfully removed"});
    });
  });

  return api;
}
