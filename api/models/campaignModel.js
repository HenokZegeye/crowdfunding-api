// importing mongoose and the database connection defined in that file
const mongoose = require("../../db");

// $$$

const faqSchema = new mongoose.Schema({
  campaignFaq_faqQuestion: { type: String, required: true },
  campaignFaq_faqAnswer: { type: String, required: true },
});

const campaignApprovalSchema = new mongoose.Schema({
  //userAccount_id : { type: mongoose.Schema.Types.ObjectId, ref:"campaign"},
  campaignApproval_status: { type: String },
  campaignApproval_statusInfo: { type: String },
  campaignApproval_dateApproved: { type: Date },
});

const fundRecordSchema = new mongoose.Schema({
  fundRecord_availableFund: { type: Number },
  fundRecord_totalDonations: { type: Number },
  fundRecord_totalWithdraw: { type: Number },
  fundRecord_totalPayedServiceFee: { type: Number },
  fundRecord_totalPendingServiceFee: { type: Number },
  fundRecord_recentUpdateDate: { type: Date },
  fundRecord_permitTransfer: { type: Boolean },
  fundRecord_raisedPercentage: { type: Number },
  fundRecord_numberOfDonors: { type: Number },
});

const campaignSchema = new mongoose.Schema({
  //userAccount_id: { type: mongoose.Schema.Types.ObjectId, ref: "userAccount" },
  campaign_category: { type: String },
  campaign_title: { type: String, required: true },
  campaign_fundGoal: { type: Number },
  campaign_tagline: { type: String },
  campaign_endingDate: { type: Date },
  campaign_closedDate: { type: Date },
  campaign_story: { type: String },
  campaign_url: { type: String },
  campaign_type: { type: String },
  campaign_imageUrl: { type: String },
  campaign_city: { type: String },
  campaign_region: { type: String },
  campaign_country: { type: String },
  campaign_numberOfVisits: { type: Number },

  campaignFaq: [faqSchema],
  campaignApproval: [campaignApprovalSchema],
  fundRecord: [fundRecordSchema],

  //campaign_giving: { type: String },
  //campaign_supportRequest: { type: Boolean },
});

module.exports = mongoose.model("Campaign", campaignSchema);
