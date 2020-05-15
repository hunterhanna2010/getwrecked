const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

//POST /auth/signup
router.post('/signup', (req, res) => {
  console.log('in sign up route')
  //See if the email is already in the db 
  User.findOne({ email: req.body.email }, (err, user) => {
    //if yes, return error
    if (user) {
      res.json({
        type: 'error',
        message: 'Email already in database'
      })
    } else {
      //if no, create the user in the db 
      let user = new User(req.body);
      user.save((err, user) => {
        if(err) {
          res.json({
            type: 'error',
            message: 'Database error creating user',
            error: err
          })
        } else {
          //sign a token
          const token = jwt.sign(user.toObject(),process.env.JWT_SECRET, {
            expiresIn: '1d'
          });
          //return the token
          res.status(200).json({
            type: 'success', 
            user: user.toObject(),
            token
          })
        }
      })
    }
  })
});

//POST /auth/login
router.post('/login', (req, res) => {
  //Find user in db
  User.findOne({ email: req.body.email }, (err, user) => {
    //if no user, return err 
    if (!user) {
      res.json({
        type: 'error',
        message: 'Account not found'
      })
    } else {
      //if user, check auth 
      if (user.authenticated(req.body.password)) {
        //if authenticated, sign a token 
        const token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
          expiresIn: '1d'
        });
        // return the token 
        res.status(200).json({
          type: 'success', 
          user: user.toObject(),
          token
        })
      } else {
        //authentication failed
        res.json({
          type: 'error',
          message: 'Authentication failure'
        })
      }
    }
  })
});

//POST /auth/me/from/token 
router.post('/me/from/token', (req, res) => {
  //request must contain a token
  let token = req.body.token;
  if (!token) {
    //if not token, return error
    res.json({
      type: 'error',
      message: 'You must include a valid token'
    })
  } else {
    //if token, verify it
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if(err) {
        //if errors during verification, return error (bad token)
        res.json({
          type: 'error',
          message: 'Invalid token. Please log in again.'
        })
      } else {
        //if token is valid, use token to look up user in db 
        User.findById(user._id, (err, user) => {
          //if no user, return error
          if (err) {
            res.json({
              type: 'error',
              message: 'Database error during validation'
            })
          } else {
            //if user, return user and token to front 
            res.json({
              type: 'success',
              user: user.toObject(),
              token
            })
          }
        })
      }
    })
  }
});

module.exports = router;