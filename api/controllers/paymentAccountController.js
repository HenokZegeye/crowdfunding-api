const express = require('express');
const router= express.Router();

const PaymentAccount = require("../models/paymentAccountModel");

// $$$

// update a paymentAccount balance @
router.patch('/:bankNumber', async (req, res)=>{
    try{
        let bankNumber= req.params.bankNumber;
        let newBalance = req.body.paymentAccount_balance;
        if(newBalance >=0){
            const updatedPaymentAccountBalance = await PaymentAccount.updateOne(
                {paymentAccount_bankNumber: bankNumber},
                {$set: {paymentAccount_balance: newBalance}}
            )
            res.status(201).json(updatedPaymentAccountBalance)
        }else{
            res.status(400).json({
                status: "fail",
                message: `fail ... PaymentAccount balance can not be ${newBalance}`
            })
        }
    }catch(err){
        res.status(500).json({
            status: "fail",
            message: "fail... server error can not update PaymentAccount Balance"
        })
    }
})

// get all paymentAccount @
router.get('/', async (req,res)=>{
    try{
        const paymentAccountList= await PaymentAccount.find();
        if(paymentAccountList.length <=0){
            res.status(200).json({
                status: "fail",
                message: "fail .. There are no paymentAccounts"
            })
        }else{
            res.status(200).json(paymentAccountList)
        }
    }catch(err){
        res.status(500).json({
            status: "fail",
            message: "fail ... server error can not find PaymentAccounts ",
            error: err.message
        })
    }
})

// get and view one paymentAccount @
router.get('/:bankNumber', getPaymentAccount, (req, res)=>{
    res.send(res.paymentAccount);
})

// create a paymentAccount @
router.post('/', async(req, res, next)=>{
    let availableBalance = req.body.paymentAccount_balance;
    let newBankNumber = req.body.paymentAccount_bankNumber;
    let paymentAccount = new PaymentAccount({
        paymentAccount_bankNumber: req.body.paymentAccount_bankNumber,
        paymentAccount_owner: req.body.paymentAccount_owner,
        paymentAccount_balance: req.body.paymentAccount_balance,
        paymentAccount_updateDate: Date.now() 
    })
    try{
        currentPaymentAccountList = await PaymentAccount.find({paymentAccount_bankNumber:newBankNumber});
        if(currentPaymentAccountList.length >=1 ){
            res.status(400).json({
                status: "fail",
                message: `fail ... bankNumber ${newBankNumber} already exists and should be unique `
            })
        }else{                   
            if(availableBalance <0){
                res.status(400).json({
                    status: "fail",
                    message: `fail ... balance can not be ${availableBalance}`
                })
            }else{
                const newPaymentAccount = await paymentAccount.save();
                res.status(201).json(newPaymentAccount);
            }
        }
    }catch(err){
        res.status(400).json({
            status: "fail",
            message: "fail ... internal error when creating PaymentAccount",
            error: err.message
        })
    }
})

// function for getting paymentAccouont @
async function getPaymentAccount(req, res, next){
    let paymentAccount ;
    try{
        let inputBankNumber = req.params.bankNumber;
        paymentAccount = await PaymentAccount.find({paymentAccount_bankNumber:inputBankNumber});
        if(paymentAccount.length <=0 ){
            return res.status(404).json({
                status: "fail",
                message: "fail .. can not find paymentAccount"
            })
        }       
    }catch(err){
        return res.status(500).json({
            status: "fail",
            message: "fail .. internal server error while reading",
            error: err.message })
    }
    res.paymentAccount= paymentAccount;
    next();
}

module.exports= router;

