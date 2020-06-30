var express = require('express');
var router = express.Router();
const crypto = require('../add-ons/crypto')
var calls = require('../add-ons/calls')
const db = require('../add-ons/mongodb')
const ObjectId = require('mongodb').ObjectID;

/* GET dashboard page. */
router.get('/dashboard', function(req, res, next) {
  db.findCount(`users`,{},{}, usr=>{
    db.findCount(`requests`,{},{}, reqs=>{
      db.findCount(`requests`,{paymentStatus:"payment successful"},{},scsp =>{
        res.json({
          code: 01,
          message:"Successful",
          data : {
            userCnt : usr,
            transactionCnt : reqs,
            successfulCnt : scsp
          }
        })
      })
    })
  })
});

/* POST Register User */
router.post('/register/user', async function(req, res, next) {
  db.findOne(`users`,{msisdn : req.body.msisdn}, (async resp => {
    try {
      if(resp === null){
        const uuid = await calls.generateUUID();
        const uuid1 = await calls.generateUUID();
        const col = await calls.registerCollection(uuid);
        const dis = await calls.registerDisbursement(uuid1);
        const data = req.body;
        if (col === 201 && dis === 201){
          data["collection_reference"] = crypto.encrypt(uuid)
          data["disbursement_reference"] = crypto.encrypt(uuid1)
          data["date"] = new Date()
          data["status"] = "inactive";
          db.saveOne("users",data, results => {
            if (results !== null){
              res.json({
                code: "01",
                message: "User created",
                data: []
              })
            }else{
              res.json({
                  code: "02",
                  message: "Failed to create user",
                  data: []
              })
            }
          })
        }else{
          res.json({
            code: "02",
            message: "Failed to create user",
            data: []
          })
        }
      }else{
        res.json({
          code: "02",
          message: "This number is already registered",
          data: []
        })
      }
    } catch (error) {
      res.statusCode(500)
    }
  }))
});

/* PUT Activate user account */
router.put('/activate/user',function(req, res, next){
  const id = req.body.id;
  const status = req.body.status
  if(status === "active"){
    calls.saveUserKey(id)
  }
  db.updateOne("users",{_id:ObjectId(id)},{status:status},null)
  db.findOne("users",{_id:ObjectId(id)}, out =>{
    if (out.status === status){
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

})

/* GET transactions*/
router.get('/transactions/user',function(req,res,next){
  db.findMany(`requests`,{}, resp => {
    let rsn = []
    resp.data.forEach(element => {
      rsn.push({
        "_id":element._id,
        "transactionId": element.financialTransactionId,
        "amount": element.amount,
        "currency":element.currency,
        "sender":element.payee,
        "reciepient" : element.payer.partyId,
        "status" : element.paymentStatus,
        "date": element.lastModified.toDateString()
      })
      // console.log(element.lastModified.toDateString())
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
})

module.exports = router;