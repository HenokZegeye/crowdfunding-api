// importing mongoose and the database connection defined in that file
const mongoose = require('../../db'); 

// $$$

const paymentAccountSchema= new mongoose.Schema({
    paymentAccount_bankNumber: { type: Number, required: true},
    paymentAccount_owner: { type: String, require: true},
    paymentAccount_balance: { type: Number, required: true},
    paymentAccount_updateDate: {type: Date}
})

module.exports= mongoose.model('paymentAccount', paymentAccountSchema);