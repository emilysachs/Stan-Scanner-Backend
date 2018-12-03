import mongoose from 'mongoose';
import { Router } from 'express';
import Following from '../model/following';

import { authenticate } from '../middleware/authMiddleware';

export default({config, db}) => {
  let api = Router();

  // '/v1/following/add' - Create
  api.post('/add', (req, res) => {
    Following.find({from: req.body.from, to: req.body.to}, (err, following) => {
      if(following.length > 0){
        res.json({error: true, message: 'Following record already exists'});
      } else {
        let following = new Following();
        following.from = req.body.from;
        following.to = req.body.to;
        following.save(err => {
          if(err){
            res.send(err);
          }
          res.json({error: false, message: 'Following record saved successfully'});
        });
      }
    });
  });

  // '/v1/following/:from' - Read
  api.get('/:from', (req, res) => {
    Following.find(req.body.from, (err, allFollowing) => {
      if(err){
        res.send(err);
      }
      res.json(allFollowing);
    });
  });

  // '/v1/following/mutual/:from/:to' - Read
  api.get('/mutual/:from/:to', (req, res) => {
    Following.find({from: req.params.from, to: req.params.to}, (err, following) => {
      if (err) {
        res.send(err);
      }
      console.log(following);
      if(following.length > 0){
        Following.find({from: req.params.to, to: req.params.from}, (err, following) => {
          if (err) {
            res.send(err);
          }
          console.log(following);
          if(following.length > 0){
            res.json({following: true, mutuals: true, message: "Following records exist mutually"});
          } else {
            res.json({following: true, mutuals: false, message: "Following records exist one way"});
          }
        });
      } else {
        res.json({following: false, mutuals: false, message: "Following records do not exist mutually"});
      }
    });
  });

  // '/v1/following/:from/:to' - Read
  api.get('/:from/:to', (req, res) => {
    Following.find({from: req.params.from, to: req.params.to}, (err, following) => {
      if (err) {
        res.send(err);
      }
      console.log(following);
      if(following.length > 0){
        res.json({following: true, message: "Following record exists"});
      } else {
        res.json({following: false, message: "Following record does not exist"});
      }
    });
  });

  // '/v1/following/:from/:to' - Delete
  api.delete('/:from/:to', (req, res) => {
    Following.remove({from: req.body.from, to: req.body.to}, (err, following) => {
      if (err) {
        res.send(err);
      }
      res.json({message: "Following record successfully removed"});
    });
  });

  return api;
}
