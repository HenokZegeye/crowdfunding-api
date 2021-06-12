// importing mongoose and the database connection defined in that file
const mongoose = require("../../db");

const userAccountSchema = new mongoose.Schema({
  userAccount_email: {
    type: String,
    required: true,
    /*unique: true,*/
    match: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  userAccount_password: { type: String, required: true },
  userAccount_firstName: { type: String },
  userAccount_lastName: { type: String },
  userAccount_accountType: {
    type: String,
    default: "fundraiser",
    enum: ["fundraiser", "admin", "assistant"],
  },
  userAccount_accountStatus: { type: String, default: "active" },
  userAccount_phoneNumber: { type: Number },
  userAccount_dateCreated: { type: Date },
  //userAccount_gender: {type: String },
  //userAccount_addressCoutry: {type: String },
  //userAccount_addressRegion: {type: String },
  //userAccount_addressCity: {type: String }
});

module.exports = mongoose.model("userAccount", userAccountSchema);
