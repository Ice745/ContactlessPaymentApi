var express = require('express');
var router = express.Router();
const calls = require('../add-ons/calls')
const db = require('../add-ons/mongodb')
const ds = require('../add-ons/Stack')
const ObjectId = require('mongodb').ObjectID;
const randomstring = require('randomstring')
const crypto = require('../add-ons/crypto')
const message = require('../add-ons/messages')


/* GET users listing. */
router.get('/all', function(req, res, next) {
  db.findMany("users",{}, resp =>{
    let rsn =[]
    resp.data.forEach(element => {
      rsn.push({"_id":element._id,
                  "name":element.name,
                  "type":element.account,
                  "msisdn":element.msisdn,
                  "status":element.status,
                  "date": element.date.toDateString()
                })
              })
    if (resp.status === 200){
      res.json({
        code: "01",
        message: "Successful",
        data: rsn
      })
    }else{
      res.json({
        code: "02",
        message: "Failed",
        data: []
      })
    } 
  })
});


router.post('/phone/card', function(req, res, next){
  console.log(req.body)
  db.findOne("users",{msisdn:req.body.msisdn}, resp =>{
    db.updateOne("users",{msisdn:req.body.msisdn},{phoneCard:req.body.phoneCard},null)
    if(resp != null){
      res.json({message:"Successful",data: resp})
    }else{
      res.json({message:"Failed"})
    }
  })
})

router.post('phone/request/transfer',function(req,res,next){
  const phoneCard = req.body.phoneCard;
  db.findOne("users",{phoneCard:phoneCard}, resp =>{
    if(req.body.userPIN === resp.PIN){
        let trans = resp.requests
        console.log(trans)
        ds.empty()
        trans.forEach(element => {
          ds.push(element.request_id)
        });
        const id = ds.peek()
        // console.log(id)
        db.findOne("requests",{_id:ObjectId(id)}, async response => {
        if (response.paymentStatus === "pending payment"){
          let charge = .5
          if(response.amount > 50) charge = 0.001 * response.amount
            const total = response.amount + charge
            if(total < resp.balance){
              const data = {
                amount : total * 0.1637,
                currency : "EUR",
                externalId: randomstring.generate(20),
                payee : {
                  partyIdType : "MSISDN",
                  partyId : response.payee
                },
                payerMessage: response.payerMessage,
                payeeNote: response.payeeNote,
              }
            try {
              const ref = crypto.decrypt(resp.disbursement_reference);
              const key = crypto.decrypt(resp.disbursement_Key)
              const refid  = await calls.generateUUID()

              await calls.getTokenBearer(ref,key)
              .then(async token => {
                await calls.sendPayment(token.access_token,refid,data)
                .then(async result => {
                  await calls.checkTransfer(refid,token)
                  .then(fdbk => {
                      if (fdbk.data.status === "SUCCESSFUL"){
                          const infor = {
                              financialTransactionId: fdbk.data.financialTransactionId,
                              externalId: fdbk.data.externalId,
                              amount: (parseFloat(fdbk.data.amount)*(1/ 0.1637)),
                              currency: "GHS",
                              payee: fdbk.data.payee,
                              payerMessage: fdbk.data.payerMessage,
                              payeeNote: fdbk.data.payeeNote,
                              status: fdbk.data.status,
                          }
                          message.send(resp.msisdn,response.payee,infor.amount,resp.balance-infor.amount)
                          db.saveOne("payments",infor, rep => {
                            const payment_id = {payment_id : rep.insertedId}
                            db.updateOne("users",{userCard:userCard},{balance : resp.balance-infor.amount},{payments : payment_id})
                            db.findOne("users",{msisdn:infor.payee.partyId}, output => {
                            let balance = output.balance
                            db.updateOne("users",{msisdn: infor.payee.partyId},{balance : balance+infor.amount},{payments : payment_id})
                          })
                        })
                        db.updateOne("requests",{_id: ObjectId(id)},{paymentStatus : "payment successful"},null)
                        db.findOne("requests",{_id: ObjectId(id)}, resps => {
                          if (resps.paymentStatus === "payment successful"){
                            res.json({
                              code: "01",
                              message: "Successful",
                              data: []
                            })
                          }else{
                            res.json({
                              code: "02",
                              message: "Failed",
                              data: []
                            })
                          }
                        })
                      }
                    })
                  })
                })
            }catch (error) {
              console.log(error)
            }
          }else{
            ds.pop()
            db.updateOne("requests",{_id:ObjectId(id)},{paymentStatus : "failed payment"})
            res.json({
                code: "01",
                message : "Insufficient funds for transactions",
                data : []
            })
        }
        }
      })
    }else{
      res.json({message : `Unauthorized`})
    }
    // res.json({data:trans})
  })
})

/* POST make payment */
router.post('/request/transfer',function(req,res,next){
  const userCard = req.body.userCard;
  db.findOne("users",{userCard:userCard}, resp =>{
    if(req.body.userPIN === resp.PIN){
        let trans = resp.requests
        console.log(trans)
        ds.empty()
        trans.forEach(element => {
          ds.push(element.request_id)
        });
        const id = ds.peek()
        // console.log(id)
        db.findOne("requests",{_id:ObjectId(id)}, async response => {
        if (response.paymentStatus === "pending payment"){
          let charge = .5
          if(response.amount > 50) charge = 0.001 * response.amount
            const total = response.amount + charge
            if(total < resp.balance){
              const data = {
                amount : total * 0.1637,
                currency : "EUR",
                externalId: randomstring.generate(20),
                payee : {
                  partyIdType : "MSISDN",
                  partyId : response.payee
                },
                payerMessage: response.payerMessage,
                payeeNote: response.payeeNote,
              }
            try {
              const ref = crypto.decrypt(resp.disbursement_reference);
              const key = crypto.decrypt(resp.disbursement_Key)
              const refid  = await calls.generateUUID()

              await calls.getTokenBearer(ref,key)
              .then(async token => {
                await calls.sendPayment(token.access_token,refid,data)
                .then(async result => {
                  await calls.checkTransfer(refid,token)
                  .then(fdbk => {
                      if (fdbk.data.status === "SUCCESSFUL"){
                          const infor = {
                              financialTransactionId: fdbk.data.financialTransactionId,
                              externalId: fdbk.data.externalId,
                              amount: (parseFloat(fdbk.data.amount)*(1/ 0.1637)),
                              currency: "GHS",
                              payee: fdbk.data.payee,
                              payerMessage: fdbk.data.payerMessage,
                              payeeNote: fdbk.data.payeeNote,
                              status: fdbk.data.status,
                          }
                          message.send(resp.msisdn,response.payee,infor.amount,resp.balance-infor.amount)
                          db.saveOne("payments",infor, rep => {
                            const payment_id = {payment_id : rep.insertedId}
                            db.updateOne("users",{userCard:userCard},{balance : resp.balance-infor.amount},{payments : payment_id})
                            db.findOne("users",{msisdn:infor.payee.partyId}, output => {
                            let balance = output.balance
                            db.updateOne("users",{msisdn: infor.payee.partyId},{balance : balance+infor.amount},{payments : payment_id})
                          })
                        })
                        db.updateOne("requests",{_id: ObjectId(id)},{paymentStatus : "payment successful"},null)
                        db.findOne("requests",{_id: ObjectId(id)}, resps => {
                          if (resps.paymentStatus === "payment successful"){
                            res.json({
                              code: "01",
                              message: "Successful",
                              data: []
                            })
                          }else{
                            res.json({
                              code: "02",
                              message: "Failed",
                              data: []
                            })
                          }
                        })
                      }
                    })
                  })
                })
            }catch (error) {
              console.log(error)
            }
          }else{
            ds.pop()
            db.updateOne("requests",{_id:ObjectId(id)},{paymentStatus : "failed payment"})
            res.json({
                code: "01",
                message : "Insufficient funds for transactions",
                data : []
            })
        }
        }
      })
    }else{
      res.json({message : `Unauthorized`})
    }
    // res.json({data:trans})
  })
})

/* GET user details */
router.get('/details', function(req, res, next){
  const card = req.query.cardNumber
  // console.log(card)
  db.findOne("users",{userCard:card}, resp => {
    try {
      // console.log(response)
      res.status(200);
      res.json({
          code: "01",
          message: "successful",
          data : resp
        })
    }catch (err) {
      res.status(503)
      res.json({
          code: "02",
          message: "failed to connect",
          data : []
        })
      console.log('Service temporarily unavailable, try again later.')
    }
  })
})

router.get('/phone/details', function(req, res, next){
  const msisdn = req.query.msisdn
  // console.log(card)
  db.findOne("users",{msisdn:msisdn}, resp => {
    try {
      // console.log(response)
      res.status(200);
      res.json({
          code: "01",
          message: "successful",
          data : resp
        })
    }catch (err) {
      res.status(503)
      res.json({
          code: "02",
          message: "failed to connect",
          data : []
        })
      console.log('Service temporarily unavailable, try again later.')
    }
  })
})

module.exports = router;
