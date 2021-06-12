const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserAccount = require("../models/userAccountModel");
const checkAuth = require("../middlewares/checkAuth");

//create signIn
router.post("/signin", async (req, res, next) => {
  try {
    let userEmail = req.body.userAccount_email;
    let inputPassword = req.body.userAccount_password;
    userInfo = await UserAccount.find({ userAccount_email: userEmail });
    console.log("this is user info ", userInfo);
    // if user doesn't exits
    if (userInfo.length <= 0) {
      return res.status(401).json({
        status: "fail",
        message: "auth ufail",
      });
    } else {
      //console.log("emial is ##### ", userInfo[0].userAccount_email);
      //console.log("password is ##### ", userInfo[0].userAccount_password);
      //console.log("accountType is ##### ", userInfo[0].userAccount_accountType);
      //console.log("status ##### ", userInfo[0].userAccount_accountStatus);
      let hashPassword = userInfo[0].userAccount_password;

      bcrypt.compare(inputPassword, hashPassword, function (err, result) {
        //check result
        if (err) {
          return res.status(401).json({
            status: "fail",
            message: "auth cmfail",
          });
        }
        if (result) {
          console.log("bycrpt result is: ", result);
          const token = jwt.sign(
            {
              email: userInfo.userAccount_email,
              id: userInfo._id,
              accountStatus: userInfo[0].userAccount_accountStatus,
              accountType: userInfo[0].userAccount_accountType,
              username: `${userInfo[0].userAccount_firstName} ${userInfo[0].userAccount_lastName}`
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1hr",
            }
          );

          return res.status(202).json({
            status: "success",
            message: "auth success",
            signInToken: token,
          });
        }
        res.status(401).json({
          status: "fail",
          message: "auth byfail",
        });
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "fail ... server error while signing  users",
      error: err.message,
    });
  }
});

// create a userAccount
router.post("/signup", async (req, res, next) => {
  let userExist = await UserAccount.find({
    userAccount_email: req.body.userAccount_email,
  });
  if (userExist.length > 0) {
    res.status(409).json({
      status: "fail",
      message: "fail ... useraccount already exists ... sign in",
    });
  } else {
    bcrypt.hash(req.body.userAccount_password, 10, async (err, hash) => {
      if (err) {
        return res.status(500).json({
          status: "fail",
          message: "fail, encrypting the password",
          error: err.message,
        });
      } else {
        const userAccount = new UserAccount({
          userAccount_email: req.body.userAccount_email,
          userAccount_password: hash,
          userAccount_firstName: req.body.userAccount_firstName,
          userAccount_lastName: req.body.userAccount_lastName,
          //userAccount_accountType: req.body.,
          //userAccount_accountStatus: req.body.,
          userAccount_phoneNumber: req.body.userAccount_phoneNumber,
          userAccount_dateCreated: Date.now(),
        });
        try {
          const newAccount = await userAccount.save();
          const newAccountResponse = {
            status: "success",
            message: "account created successfully",
            //newUser: newAccount,
          };
          res.status(201).json(newAccountResponse);
        } catch (err) {
          res.status(500).json({
            status: "fail",
            message: "fail ... server  while creating user",
            error: err.message,
          });
        }
      } // else
    });
  }
});

// Deleting userAccount by id //checkAuth
router.delete("/:userEmail", checkAuth, getUserAccount, async (req, res) => {
  try {
    let userId = res.userInfo._id;
    const removedUserAccount = await UserAccount.deleteOne();
    res.json({
      status: "success",
      message: "userAccount deleted",
    });
  } catch (err) {
    res.json({
      status: "fail",
      message: "fail ... can not delete a user",
      error: err.message,
    });
  }
});

// get a all userAccount
router.get("/users", async (req, res) => {
  try {
    const userList = await UserAccount.find().select(["-userAccount_password"]);
    if (userList.length <= 0) {
      res.status(200).json({
        status: "fail",
        message: " fail .. There are no users in the database",
      });
    } else {
      res.status(200).json({
        status: "success",
        data: userList,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "fail ... server error while getting all users",
      error: err.message,
    });
  }
});

// get one userAccount
router.get("/:userEmail", getUserAccount, (req, res) => {
  res.send(res.userInfo);
});

async function getUserAccount(req, res, next) {
  let userEmail = req.params.userEmail;

  let userInfo;
  try {
    //let campaignId= req.params.campaignId;
    userInfo = await UserAccount.find({
      userAccount_email: userEmail,
    }).select(["-userAccount_password"]);
    if (userInfo == null || userInfo.length <= 0) {
      return res.status(404).json({
        status: "fail",
        message: "fail .. can not find userAccount",
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "fail .. internal server error getting userAccount",
      error: err.message,
    });
  }
  res.userInfo = userInfo;
  next();
}

module.exports = router;
