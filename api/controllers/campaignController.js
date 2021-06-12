const express = require("express");
const fs = require("fs");
const router = express.Router();

const uploadImage = require("../middlewares/uploadImage");
const Campaign = require("../models/campaignModel");
const checkAuth = require("../middlewares/checkAuth");

// browse campaign by status @
router.get("/status/:status", async (req, res) => {
  let status = req.params.status;
  let NumCampaignWithStatus = 0;
  console.log("status type", status);
  //
  try {
    campaignInfo = await Campaign.find();
    let campaignNum = campaignInfo.length;
    console.log("campaign num ", campaignNum);

    if (campaignInfo == null || campaignInfo.length <= 0) {
      return res.status(404).json({
        status: "fail",
        message: "fail .. can not find campaign by status",
      });
    } else {
      let campaignWithSelectedStatus = [];

      for (let i = 0; i < campaignNum; i++) {
        if (
          campaignInfo[i].campaignApproval[0].campaignApproval_status === status
        ) {
          NumCampaignWithStatus++;
          campaignWithSelectedStatus.push(campaignInfo[i]);
        }
      }
      res.status(200).json({
        NumberOfCampaigns: NumCampaignWithStatus,
        campaign: campaignWithSelectedStatus,
      });
    }
  } catch (err) {
    res.status(200).json({
      status: "fail",
      message: "fail... can not get campaign approval",
      error: err.message,
    });
  }
});
// ---

// browse campaign by category @
router.get("/category/:category", async (req, res) => {
  let category = req.params.category;
  let numOfCategory = 0;
  console.log("cat added ", category);
  //
  try {
    campaignInfo = await Campaign.find({ campaign_category: category });
    numOfCategory = campaignInfo.length;
    if (campaignInfo == null || campaignInfo.length <= 0) {
      return res.status(404).json({
        status: "fail",
        message: "fail .. can not find campaign category",
      });
    } else {
      res.status(200).json({
        numOfCategory: numOfCategory,
        campaign: campaignInfo,
      });
    }
  } catch (err) {
    res.status(200).json({
      status: "fail",
      message: "fail... can not get campaign categoy",
      error: err.message,
    });
  }
  //
});

// change campaign status by id @
router.patch("/status/:campaignId/:status", async (req, res) => {
  let campaignId = req.params.campaignId;
  console.log(" cid ", campaignId);
  let reqStatus = req.params.status;
  let UpStatus;
  //console.log(" id", campaignId);
  //console.log("req status", reqStatus);
  if (reqStatus == "launch") {
    upStatus = "waiting";
  }
  if (reqStatus == "approve") {
    upStatus = "open";
  }
  if (reqStatus == "reject") {
    upStatus = "rejected";
  }
  if (reqStatus == "close") {
    upStatus = "close";
  }

  try {
    campaignWithStatus = await Campaign.findById(campaignId).select([
      "campaignApproval",
    ]);
    if (campaignWithStatus.length === 0) {
      return res.status(200).json({
        status: "ok",
        message: "There is no campaign ",
      });
    } else {
      //res.status(200).json(campaignWithStatus);
      //console.log("campaign status", campaignWithStatus);
      let approvalId = campaignWithStatus.campaignApproval[0]._id;
      //console.log("approval id is ", approvalId);

      //console.log("status", campaignWithStatus.campaignApproval._status);
      /*console.log(
        "status",
        campaignWithStatus.campaignApproval[0].campaignApproval_status
      );*/

      let statusInfo =
        campaignWithStatus.campaignApproval[0].campaignApproval_statusInfo;
      //console.log("status info", statusInfo);

      campaignWithStatus.campaignApproval.pop();
      campaignWithStatus.campaignApproval.push({
        campaignApproval_status: upStatus,
        campaignApproval_statusInfo: statusInfo,
      });
      const updatedCampaignStatus = await campaignWithStatus.save(
        campaignWithStatus
      );
      return res.status(200).json({
        status: "success",
        message: "campaign approval status updated",
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "fail .. internal server error while gettig  campaign approval",
      error: err.message,
    });
  }

  // end
});

//#### ####

// <<Campaign FAQ>>
// delete FAQ of the campaign with id @
router.delete("/:campaignId/faq/:faqId", async (req, res) => {
  let campaignId = req.params.campaignId;
  let faqId = req.params.faqId;
  let campaign;
  let updatedCampaignFaq;
  try {
    campaign = await Campaign.findById(campaignId);
    if (campaign.campaignFaq.length > 0) {
      updatedCampaignFaq = await campaign.campaignFaq.id(faqId).remove();
      await campaign.save(updatedCampaignFaq);
      res.status(200).json({
        status: "success",
        message: `success ... campaign faq with Id: ${faqId} deleted successfully`,
      });
    } else {
      res.status(404).json({
        status: "fail",
        message: " fail .. there are no campaigns faqs ",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message:
        "fail ... internal server error can not find and delete campaign faq",
      error: err.message,
    });
  }
});

// view only FAQ of the campaign with id @
router.get("/:campaignId/faq", async (req, res) => {
  let campaignWithFaq;
  try {
    let campaignId = req.params.campaignId;
    campaignWithFaq = await Campaign.findById(campaignId).select([
      "campaignFaq",
    ]);
    if (campaignWithFaq.campaignFaq.length == 0) {
      return res.status(200).json({
        status: "ok",
        message: "There are no campaign faqs",
      });
    } else {
      res.status(200).json(campaignWithFaq);
    }
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "fail .. internal server error while reading campaign faq",
      error: err.message,
    });
  }
});

// add FAQ into campaign @
router.post("/:campaignId/faq", getCampaign, async (req, res) => {
  try {
    let campaignFaqNum = res.campaignInfo.campaignFaq.length;
    if (campaignFaqNum >= 30) {
      res.status(200).json({
        status: "ok",
        message: ` fail ... number of campaign faq can not be more than ${campaignFaqNum} remove some before adding campaign faq`,
      });
    } else {
      let campaignInfoWithFaq = res.campaignInfo;
      campaignInfoWithFaq.campaignFaq.push({
        campaignFaq_faqQuestion: req.body.campaignFaq_faqQuestion,
        campaignFaq_faqAnswer: req.body.campaignFaq_faqAnswer,
      });
      const campaignWithFaq = await res.campaignInfo.save(campaignInfoWithFaq);
      res.json(campaignWithFaq.campaignFaq);
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "fail ... can not add campaign FAQ to database",
      error: err.message,
    });
  }
});

// <<Campaign contents>>
// Getting all campaigns @
router.get("/", async (req, res) => {
  try {
    const campaignList = await Campaign.find();
    if (campaignList.length <= 0) {
      res.status(200).json({
        status: "fail",
        message: " fail .. There are no campaigns in the database",
      });
    } else {
      res.status(200).json(campaignList);
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "fail ... server error while getting all campaigns",
      error: error.message,
    });
  }
});

// Add a Campaign @
router.post("/", uploadImage.single("campaign_imageUrl"), async (req, res) => {
  let campaign = new Campaign({
    campaign_title: req.body.campaign_title,
    campaign_category: req.body.campaign_category,
    campaign_fundGoal: req.body.campaign_fundGoal,
    campaign_tagline: req.body.campaign_tagline,
    campaign_endingDate: req.body.campaign_endingDate,
    campaign_story: req.body.campaign_story,
    campaign_url: req.body.campaign_url,
    campaign_type: req.body.campaign_type,
    campaign_city: req.body.campaign_city,
    campaign_region: req.body.campaign_region,
    campaign_country: "Ethiopia",
    campaign_numberOfVisits: 0,
    // campaign_closedDate: ,
    //
  });

  // adding the campaign fund records
  campaign.fundRecord.push({
    fundRecord_availableFund: 0,
    fundRecord_totalDonations: 0,
    fundRecord_totalWithdraw: 0,
    fundRecord_totalPayedServiceFee: 0,
    fundRecord_totalPendingServiceFee: 0,
    fundRecord_recentUpdateDate: Date.now(),
    fundRecord_permitTransfer: true,
    fundRecord_raisedPercentage: 0,
  });

  // adding campaign status
  campaign.campaignApproval.push({
    //??userAccount
    campaignApproval_status: "waiting",
    campaignApproval_statusInfo: "campaign created",
    campaignApproval_dateApproved: Date.now(),
  });
  // adding picture
  if (req.file) {
    campaign.campaign_imageUrl = req.file.path;
  } else {
    campaign.campaign_imageUrl = null;
  }
  try {
    const newCampaign = await campaign.save();
    res.status(201).json(newCampaign);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "fail ... an error occured while adding Campaign to database",
      error: err.message,
    });
    // to remove the uploaded picture when adding to database fails
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  }
});

// get selected campaign information @
router.get("/:campaignId", getCampaign, (req, res) => {
  res.send(res.campaignInfo);
});

// Deleting campaign by id @
router.delete("/:campaignId", getCampaign, async (req, res) => {
  try {
    //res.send(res.campaignInfo.campaign_imageUrl);
    if (res.campaignInfo.campaign_imageUrl == null) {
      await res.campaignInfo.remove();
    } else {
      let campaign_imageUrl = res.campaignInfo.campaign_imageUrl;
      if (await res.campaignInfo.remove()) {
        fs.unlink(campaign_imageUrl, (err) => {
          if (err) {
            console.error(err);
            return;
          }
        });
      }
    }
    res.status(200).json({ message: "success .. campaign deleted" });
  } catch (err) {
    res.status(500).json({
      message: "fail .. in internal server error while deleting",
      error: err.message,
    });
  }
});

// Updating campaign contents by id @
router.patch("/:campaignId", getCampaign, async (req, res) => {
  if (req.body.campaign_title != null && req.body.campaign_title.length > 2) {
    try {
      const updatedCampaignInfo = await res.campaignInfo.updateOne(req.body);
      res.status(200).json(updatedCampaignInfo);
      console.log(updatedCampaignInfo);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else {
    res.json({
      message: " fail updating campaign... campaign title can not be empty",
    });
  }
});

// Updating campaign image by id @
router.patch(
  "/:campaignId/image",
  getCampaign,
  uploadImage.single("campaign_imageUrl"),
  async (req, res) => {
    let preCampaignImageUrl;
    preCampaignImageUrl = res.campaignInfo.campaign_imageUrl;
    try {
      if (req.file) {
        console.log("there it is the picture");
        res.campaignInfo.campaign_imageUrl = req.file.path;
      } else {
        res.campaignInfo.campaign_imageUrl = null;
        console.log("it is undefined or null");
      }
      const updatedCampaignImage = await res.campaignInfo.save();
      res.status(201).json(updatedCampaignImage);
      if (preCampaignImageUrl != null) {
        fs.unlink(preCampaignImageUrl, (err) => {
          if (err) {
            console.error(err);
            return;
          }
        });
      }
    } catch (err) {
      res.status(400).json({
        message:
          "fail ... an error occured while updating Campaign Image to database",
        error: err.message,
      });
      // to remove the uploaded picture when adding to database fails
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    }
  }
);

// function to get one campaign by id with all information
async function getCampaign(req, res, next) {
  let campaignId = req.params.campaignId;

  let campaignInfo;
  try {
    //let campaignId= req.params.campaignId;
    campaignInfo = await Campaign.findById(campaignId);
    if (campaignInfo == null) {
      return res.status(404).json({
        status: "fail",
        message: "fail .. can not find campaign",
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "fail .. internal server error while reading",
      error: err.message,
    });
  }
  res.campaignInfo = campaignInfo;
  next();
}

module.exports = router;
