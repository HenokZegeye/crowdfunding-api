// importing mongoose and the database connection defined in that file
const mongoose = require('../../db'); 


const serviceFeeSchema= new mongoose.Schema({
    serviceFee_percentage: {type: Number },
    serviceFee_amount: {type: Number }
});

const paymentTransferSchema= new mongoose.Schema({
    campaign_id : { type: mongoose.Schema.Types.ObjectId, ref:"campaign"}, 
    paymentAccount_senderBankNumber: {type: Number, ref:"paymentAccount"},
    paymentAccount_receiverBankNumber: {type: Number, ref:"paymentAccount"},
    paymentTransfer_campaignAvailableFund: {type: Number},
    paymentTransfer_transferAmount: {type: Number },
    paymentTransfer_type: {type: String },
    paymentTransfer_receiverBalance: {type: Number },
    paymentTransfer_receiverUpdateBalance: {type: Number },
    paymentTransfer_senderBalance: {type: Number },
    paymentTransfer_senderUpdateBalance: {type: Number },
    paymentTransfer_receiverOperation: {type: String },
    paymentTransfer_senderOperation: {type: String },
    paymentTransfer_completionStatus: {type: String }, 
    paymentTransfer_date: {type: Date },
    serviceFee: [serviceFeeSchema]

})

module.exports= mongoose.model('paymentTransfer', paymentTransferSchema);

