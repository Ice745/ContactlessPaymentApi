var express = require('express');
var router = express.Router();
const calls = require('../add-ons/calls')
const db = require('../add-ons/mongodb')
const randomstring = require('randomstring')
const crypto = require('../add-ons/crypto')

/* GET merchant listing. */
// router.get('/all', function(req, res, next) {
//   db.findMany("users",{account:"merchant"}, resp =>{
//     let rsn =[]
//     resp.data.forEach(element => {
//       rsn.push({"_id":element._id,
//                   "name":element.name,
//                   "currency":element.currency,
//                   "msisdn":element.msisdn,
//                   "status":element.status
//                 })
//               })
//     if (resp.status === 200){
//       res.json({
//         code: "01",
//         message: "Successful",
//         data: rsn
//       })
//     }else{
//       res.sendStatus(resp.status)
//       res.json({
//         code: "02",
//         message: "Failed",
//         data: []
//       })
//     } 
//   })
// });


/* POST request payment */
router.post('/request/payment', function(req, res, next) {
  // req.body = JSON.parse(req.body)
    let data  = {
        "amount": (parseFloat(req.body.amount) * 0.1637), "currency": "EUR",
        "externalId":randomstring.generate(20), "payer":req.body.payer,
        "payerMessage":"payment for goods and/or services",
        "payeeNote":"payment for goods and/or services"
    };
    console.log(req.body)
    db.findOne("users", {name:req.body.accountHolder}, async resp =>{
      if(resp.PIN === req.body.securityPin){
        // db.findOne("users",{msisdn:msisdn}, async resp =>{
          try{
            const ref = crypto.decrypt(resp.collection_reference);
            const key = crypto.decrypt(resp.collection_Key)
            let refid = await calls.generateUUID()
            await calls.getBearerToken(ref,key)
            .then(async token =>{
              await calls.requestPayment(token.access_token,refid,data)
              .then(async response =>{
                if(response.status === 202) {
                  res.status(202)
                  res.json()
                }else{
                  res.status(400)
                  res.json(response.data)
                }
                await calls.checkRequest(refid,token)
                .then(req_status => {
                  const info = {
                    financialTransactionId: req_status.data.financialTransactionId,
                    externalId: req_status.data.externalId,
                    amount: (parseFloat(req_status.data.amount)*(1/ 0.1637)),
                    currency: "GHS",
                    payer: req_status.data.payer,
                    payerMessage: req_status.data.payerMessage,
                    payeeNote: req_status.data.payeeNote,
                    status: req_status.data.status,
                    payee : resp.msisdn,
                    paymentStatus: "pending payment"
                  }
                  db.saveOne("requests",info, reply => {
                    const request_id = {request_id : reply.insertedId}
                    db.updateOne("users",{msisdn: info.payee},null,{requests : request_id})
                    db.updateOne("users",{msisdn: info.payer.partyId},null,{requests : request_id})
                  })
                }).catch(err =>{
                  console.log(err)
                })
              }).catch(error => {
                console.log(error)
              })
            })
          }catch (err) {
            res.status(500)
            res.json('Service temporarily unavailable, try again later.')
            console.log(err)
          }
        // })
      }else{
        res.json("Incorrect PIN code")
      }
    })
})

/* GET merchant balance */
router.get('/balance', function(req, res, next){
  const msisdn = req.query.msisdn
  db.findOne("users",{msisdn:msisdn}, resp=>{
    try {
      let response = {
          'currency': resp.currency,
          'balance' : resp.balance
      }
      console.log(response)
      res.status(200);
      res.json({
          code: "01",
          message: "successful",
          data : response
      })
    }catch (err) {
      res.status(503)
      res.json('Service temporarily unavailable, try again later.')
      console.log('Service temporarily unavailable, try again later.')
    }
  })
})

module.exports = router;
