const express = require('express');
const router = express.Router();

const Campaign= require('../models/campaignModel');
const PaymentTransfer = require("../models/paymentTransferModel")
//const CampaignController = require("../controllers/campaignController");
//const PaymentAccount = require("../models/paymentAccountModel");


// $$@ calculate campaign withdraw fund 
async function calculateCampaignWithdraw(campaignId){ 
    //console.log("received id is ", campaignId);
    let searchCampaignId= campaignId;
    try{
        const campaignWithdrawList = await PaymentTransfer.find({campaign_id: searchCampaignId, paymentTransfer_type:"withdraw"});
        if(campaignWithdrawList.length <=0){
            res.status(200).json({
                status: "fail",
                message: "fail ... there is no any paymentTransfer withdraw to calculate withdraw"
            })
        }else{
            console.log("success");
            let numberOfWithdraws = campaignWithdrawList.length;
            console.log(" withdraw num", numberOfWithdraws);
            let allWithdrawSum= 0 ;
            let totalTransferDisbursement= 0;
            let allPayedServiceFeeSum= 0 ;
            let platformPercentageCut= 0;
            // calculate total transferDisbursement
            for(let i=0;i<numberOfWithdraws;i++){
                totalTransferDisbursement += campaignWithdrawList[i].paymentTransfer_transferAmount;
                //console.log(`disbursement amount at ${i} is: `, totalTransferDisbursement)
            }
            // Calculate totalPayedServiceFee
            for(let i=0;i<numberOfWithdraws;i++){
                let tempServiceFee= campaignWithdrawList[i].serviceFee[0].serviceFee_amount;
                allPayedServiceFeeSum +=tempServiceFee;
               // console.log(`payed service fee at ${i} is: `, allPayedServiceFeeSum);
            }
            allWithdrawSum = allPayedServiceFeeSum + totalTransferDisbursement;
            try{
                const campaignWithFundRecord= await Campaign.findById(searchCampaignId).select(["fundRecord","campaign_fundGoal"]);
                //console.log(" campaingWithFundRecord ", campaignWithFundRecord);
                let preAvailableFund = campaignWithFundRecord.fundRecord[0].fundRecord_availableFund;
                //console.log("preAvailable: ", preAvailableFund);
                let preTotalDonation = campaignWithFundRecord.fundRecord[0].fundRecord_totalDonations;
                //console.log("preTotaldonation: ", preTotalDonation);
                let preWithdraw = campaignWithFundRecord.fundRecord[0].fundRecord_totalWithdraw;
                //console.log("prewithdraw: ", preWithdraw);
                let prePayedServiceFee =  campaignWithFundRecord.fundRecord[0].fundRecord_totalPayedServiceFee;
                //console.log("prePayedServiceFee: ", prePayedServiceFee);
                let prePendingServiceFee = campaignWithFundRecord.fundRecord[0].fundRecord_totalPendingServiceFee;
                //console.log("prePendingServiceFee: ", prePendingServiceFee);
                let prePermitTransfer = campaignWithFundRecord.fundRecord[0].fundRecord_permitTransfer;
                //console.log("prePermitTransfer: ", prePermitTransfer);
                let preRaisedPercentage = campaignWithFundRecord.fundRecord[0].fundRecord_raisedPercentage;
                //console.log("preRaisedPecentage: ", preRaisedPercentage);
                let fundingGoal = campaignWithFundRecord.campaign_fundGoal;
                //console.log("fund goal : ", fundingGoal);
               campaignWithFundRecord.fundRecord.pop();
               campaignWithFundRecord.fundRecord.push({
                    fundRecord_availableFund: (preTotalDonation-allWithdrawSum),
                    fundRecord_totalDonations: preTotalDonation,
                    fundRecord_totalWithdraw: allWithdrawSum,
                    fundRecord_totalPayedServiceFee: allPayedServiceFeeSum,
                    fundRecord_totalPendingServiceFee: (platformPercentageCut*(preTotalDonation-allWithdrawSum)),
                    fundRecord_recentUpdateDate: Date.now(),
                    fundRecord_raisedPercentage: ((preTotalDonation/fundingGoal)*100).toFixed(2),
                    fundRecord_permitTransfer: prePermitTransfer,
                })
                const updatedCampaignFundRecord = await campaignWithFundRecord.save(campaignWithFundRecord);
            }catch(err){
                res.status().json({
                    status:"fail",
                    message: "fail ... from calculateCampaignWithdraw method for get campaignFund",
                    error: err.message
                })
            }
        }
    }catch(err){
        res.status().json({
            status:"fail",
            message: "fail ... from calculateCampaignWithdraw method for getting paymentTrasfer",
            error: err.message
        })
    }
}

// $$@@ make withdraw for a campaign @
router.post('/withdraw/:campaignId', checkCampaignWithdrawValidity, async (req, res)=>{
    let campaignId= req.params.campaignId;
    let result = res.result;
    let transferAmount;
    
    if(result == true){
        const campaignInfo = await Campaign.findById(campaignId).select(["fundRecord"]);
        let availableFund = campaignInfo.fundRecord[0].fundRecord_availableFund;
        // calculate transfer amount from percentage cut 
        let platformPercentageCut = 0.05; 
        let withServiceFee= platformPercentageCut * availableFund;
        transferAmount= availableFund-withServiceFee;

        if(transferAmount >0){            
            let platformBankNumber= 111;
            let paymentTransfer = new PaymentTransfer({
                campaign_id : campaignId, 
                paymentAccount_senderBankNumber: platformBankNumber,
                paymentAccount_receiverBankNumber: req.body.paymentAccount_receiverBankNumber,
                paymentTransfer_campaignAvailableFund: availableFund,
                paymentTransfer_transferAmount: transferAmount,
                paymentTransfer_type: "withdraw",
                paymentTransfer_receiverOperation: "deposit",
                paymentTransfer_senderOperation: "withdraw", 
                paymentTransfer_date: Date.now(),
                serviceFee: [{
                        serviceFee_percentage: platformPercentageCut,
                        serviceFee_amount: withServiceFee
                }]
            })
            try{
                const campaignWithdrawInfo= await paymentTransfer.save();
                res.status(201).json(campaignWithdrawInfo);
                console.log("before send id is ", campaignId);
                // function call
                calculateCampaignWithdraw(campaignId);
            }catch(err){
                res.status(400).json({
                    status: "fail",
                    message: "fail ... an error occured while adding paymentTransfer to database",
                    error: err.message
                });
            }
        }

    }else{
        res.status(400).json({
            status: "fail",
            message: "fail ... can not make donation to campaign because approvalStatus is not open or permitTransfer is false"
        })
    }
})

//$$@@ check if campaign can make withdraw @
async function checkCampaignWithdrawValidity (req, res, next ){
    try{
        let campaignId= req.params.campaignId;
        let campaignStatus;
        let permitTransfer;
        const campaignInfo= await Campaign.findById(campaignId);
        if(campaignInfo != null){
            campaignStatus= campaignInfo.campaignApproval[0].campaignApproval_status;
            permitTransfer= campaignInfo.fundRecord[0].fundRecord_permitTransfer;
            if(campaignStatus !="editing" && permitTransfer === true){
                res.result = true;
                next();
            }else{
                res.result = false;
                next();
            }
        }else{
            return res.status(404).json({
                status: "fail",
                message: "fail .. can not find campaign from checkCampaignWithdraw function"
            })
        }
    }catch(err){
        res.status(200).json({
            status: "fail",
            message: "fail ... can not check CampaignApproval for paymentTransfer",
            error: err.message
        })
    }
}

//@@ calculate campaign donation after donation @
async function calculateCampaignDonation(campaignId){
    let searchCampaignId= campaignId;
    try{
        const campaignDonationList = await PaymentTransfer.find({campaign_id: searchCampaignId, paymentTransfer_type:"donation"});
        if(campaignDonationList.length <=0){
            res.status(200).json({
                status: "fail",
                message: "fail ... there is no any paymentTransfer donation to calculate donation"
            })
        }else{
            let numberOfDonations = campaignDonationList.length;
            console.log(" donation num", numberOfDonations);
            console.log(" payment transfer at O is ", campaignDonationList[0].paymentTransfer_transferAmount);
            let totalDonation= 0 ;
            for(let i=0;i<numberOfDonations;i++){
                totalDonation += campaignDonationList[i].paymentTransfer_transferAmount;
                console.log("total donation: ", totalDonation)
            }
            try{
                const campaignWithFundRecord= await Campaign.findById(searchCampaignId).select(["fundRecord","campaign_fundGoal"]);
                let preAvailableFund = campaignWithFundRecord.fundRecord[0].fundRecord_availableFund;
                //console.log("preAvailable: ", preAvailableFund);
                let preTotalDonation = campaignWithFundRecord.fundRecord[0].fundRecord_totalDonations;
                //console.log("preTotaldonation: ", preTotalDonation);
                let preWithdraw = campaignWithFundRecord.fundRecord[0].fundRecord_totalWithdraw;
                //console.log("prewithdraw: ", preWithdraw);
                let prePayedServiceFee =  campaignWithFundRecord.fundRecord[0].fundRecord_totalPayedServiceFee;
                //console.log("prePayedServiceFee: ", prePayedServiceFee);
                let prePendingServiceFee = campaignWithFundRecord.fundRecord[0].fundRecord_totalPendingServiceFee;
                //console.log("prePendingServiceFee: ", prePendingServiceFee);
                let prePermitTransfer = campaignWithFundRecord.fundRecord[0].fundRecord_permitTransfer;
                //console.log("prePermitTransfer: ", prePermitTransfer);
                let preRaisedPercentage = campaignWithFundRecord.fundRecord[0].fundRecord_raisedPercentage;
                //console.log("preRaisedPecentage: ", preRaisedPercentage);
                let preNumberOfDonors = campaignWithFundRecord.fundRecord[0].fundRecord_numberOfDonors;
                //console.log("preNumberOfDonors: ", preNumberOfDonors);
                let fundingGoal = campaignWithFundRecord.campaign_fundGoal;
                //console.log("fund goal : ", fundingGoal);

                campaignWithFundRecord.fundRecord.pop();

                campaignWithFundRecord.fundRecord.push({
                    fundRecord_availableFund: totalDonation-preWithdraw,
                    fundRecord_totalDonations: totalDonation,
                    fundRecord_totalWithdraw: preWithdraw,
                    fundRecord_totalPayedServiceFee: prePayedServiceFee,
                    fundRecord_totalPendingServiceFee: (totalDonation-preWithdraw)*0.05,
                    fundRecord_recentUpdateDate: Date.now(),
                    fundRecord_raisedPercentage: ((totalDonation/fundingGoal)*100).toFixed(2),
                    fundRecord_permitTransfer: prePermitTransfer,
                    fundRecord_numberOfDonors: numberOfDonations
                })
                const updatedCampaignFundRecord = await campaignWithFundRecord.save(campaignWithFundRecord);
            }catch(err){
                res.status(500).json({
                    status: "fail",
                    message: "fail ... server error from calculateCampaignDonation() while trying to get campaign ",
                    error: err.message
                })
            }
        }
    }catch(err){
        res.status(500).json({
            status: "fail",
            message: "fail ... server error from calculateCampaignDonation() while trying to calculate paymentTransfer Donation list",
            error: err.message
        })
    }
}

// make donation for a campaign @
router.post('/donate/:campaignId', checkCampaignDonationValidity, async (req, res)=>{
    let campaignId= req.params.campaignId;
    let result = res.result;
    let transferAmount= req.body.paymentTransfer_transferAmount;
    if(result == true){
        //console.log("result ",result);
        if(transferAmount >0){
            console.log("transfer amount is ",transferAmount);            
            let paymentTransfer = new PaymentTransfer({
                campaign_id : req.params.campaignId, 
                paymentAccount_senderBankNumber: req.body.paymentAccount_senderBankNumber,
                paymentAccount_receiverBankNumber: 111,
                paymentTransfer_transferAmount: transferAmount,
                paymentTransfer_type: "donation",
                //paymentTransfer_receiverBalance: req.body._receiverBalnce,
                //paymentTransfer_receiverUpdateBalance: req.body_receiverUpdateBalace.,
                //paymentTransfer_senderBalance: req.body_senderBalance.,
                //paymentTransfer_senderUpdateBalance: req.body_senderUpdateBalance.,
                paymentTransfer_receiverOperation: "deposit",
                paymentTransfer_senderOperation: "withdraw",
                //paymentTransfer_completionStatus: req.body_completionStatus., 
                paymentTransfer_date: Date.now()
            })
            try{
                const campaignDonation= await paymentTransfer.save();
                res.status(201).json(campaignDonation);
                calculateCampaignDonation(campaignId);
            }catch(err){
                res.status(400).json({
                    status: "fail",
                    message: "fail ... an error occured while adding paymentTransfer to database",
                    error: err.message
                });
            }
        }
    }else{
        //console.log("result ",result);
        res.status(400).json({
            status: "fail",
            message: "fail ... can not make donation to campaign because approvalStatus is not open or permitTransfer is false"
        })
    }
})

// check if campaign accept donation @
async function checkCampaignDonationValidity (req, res, next ){
    try{
        let campaignId= req.params.campaignId;
        let campaignStatus;
        let permitTransfer;
        const campaignInfo= await Campaign.findById(campaignId);
        if(campaignInfo != null){
            campaignStatus= campaignInfo.campaignApproval[0].campaignApproval_status;
            permitTransfer= campaignInfo.fundRecord[0].fundRecord_permitTransfer;
            if(campaignStatus ==="open" && permitTransfer === true){
                res.result = true;
                next();
            }else{
                res.result = false;
                next();
            }
        }else{
            return res.status(404).json({
                status: "fail",
                message: "fail .. can not find campaign from checkCampaignDonationValidity"
            })
        }
    }catch(err){
        res.status(200).json({
            status: "fail",
            message: "fail ... can not check CampaignApproval for paymentTransfer",
            error: err.message
        })
    }
}

// get all paymentTransfer in the database 
router.get('/', async(req,res)=>{
    try{
        const campaignDonationList = await PaymentTransfer.find();
        if(campaignDonationList.length <=0){
            res.status(200).json({
                status: "fail",
                message: "fail ... there is no any paymentTransfer"
            })
        }else{
            res.status(200).json(campaignDonationList);
        }
    }catch(err){
        res.status(500).json({
            status: "fail",
            message: "fail ... server error while trying to read paymentTransfer list",
            error: err.message
        })
    }
})

// get one campaign donation @
router.get('/donation/:campaignId', async(req,res)=>{
    
    let searchCampaignId= req.params.campaignId;
    try{
        const campaignDonationList = await PaymentTransfer.find({campaign_id: searchCampaignId, paymentTransfer_type:"donation"});
        //campaignWithFaq= await Campaign.findById(campaignId).select(["campaignFaq"]);
        if(campaignDonationList.length <=0){
            res.status(200).json({
                status: "fail",
                message: "fail ... there is no any paymentTransfer donation "
            })
        }else{
            //!!
            let dNum = campaignDonationList.length;
            console.log(" donation num", dNum);
            console.log(" payment transfer at O is ", campaignDonationList[0].paymentTransfer_transferAmount);
            let totalDonation= 0 ;
            for(let i=0;i<dNum;i++){
                totalDonation += campaignDonationList[i].paymentTransfer_transferAmount;
                console.log("total donation: ", totalDonation)
            }
            console.log("campaigns total donation is ", totalDonation);
            //^

            res.status(200).json(campaignDonationList);
        }
    }catch(err){
        res.status(500).json({
            status: "fail",
            message: "fail ... server error while trying to read paymentTransfer Donation list",
            error: err.message
        })
    }
})

// get one campaign withdraw @
router.get('/withdraw/:campaignId', async(req,res)=>{
    
    let searchCampaignId= req.params.campaignId;
    try{
        const campaignDonationList = await PaymentTransfer.find({campaign_id: searchCampaignId, paymentTransfer_type:"withdraw"});
        //console.log("number of withdraw is ", campaignDonationList.length);
        let numberOfWithdraw= campaignDonationList.length;
        if(numberOfWithdraw == 0 || campaignDonationList == null){
            res.status(200).json({
                status: "fail",
                message: "fail ... there is no any paymentTransfer withdraw "
            })
        }else{
            let dNum = campaignDonationList.length;
            console.log(" withdraw num", dNum);
            console.log(" withdraw transfer at O is ", campaignDonationList[0].paymentTransfer_transferAmount);
            let totalWithdraw= 0 ;
            for(let i=0;i<dNum;i++){
                totalWithdraw += campaignDonationList[i].paymentTransfer_transferAmount;
                console.log("total withdraw: ", totalWithdraw)
            }
            console.log("campaigns total withdraw is ", totalWithdraw);
            res.status(200).json(campaignDonationList);
        }
    }catch(err){
        res.status(500).json({
            status: "fail",
            message: "fail ... server error while trying to read paymentTransfer withdraw list",
            error: err.message
        })
    }
})

// get all donations in the database @
router.get('/donation', async(req,res)=>{
    try{
        const campaignDonationList = await PaymentTransfer.find({paymentTransfer_type:"donation"});
        if(campaignDonationList.length <=0){
            res.status(200).json({
                status: "fail",
                message: "fail ... there is no any donation paymentTransfer"
            })
        }else{
            res.status(200).json(campaignDonationList);
        }
    }catch(err){
        res.status(500).json({
            status: "fail",
            message: "fail ... server error while trying to getting donation paymentTransfer list",
            error: err.message
        })
    }
})

// get all withdraw in the database @
router.get('/withdraw', async(req,res)=>{
    try{
        const campaignDonationList = await PaymentTransfer.find({paymentTransfer_type:"withdraw"});
        if(campaignDonationList.length <=0){
            res.status(200).json({
                status: "fail",
                message: "fail ... there is no any withdraw paymentTransfer"
            })
        }else{
            res.status(200).json(campaignDonationList);
        }
    }catch(err){
        res.status(500).json({
            status: "fail",
            message: "fail ... server error while trying to getting withdraw paymentTransfer list",
            error: err.message
        })
    }
})

module.exports = router;
 