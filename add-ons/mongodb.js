const MongoClient = require('mongodb').MongoClient.connect;


module.exports = {
    saveOne : function (collection, data, callBack){
        MongoClient(process.env['DB_URL'],{useUnifiedTopology:true}, (err,db)=>{
            if (err) throw err
            var dbo = db.db(`${process.env['DB_NAME']}`)
            dbo.collection(collection).insertOne(data, (err,res) => {
                if (err) {
                    console.log(err)
                    return;
                }
                db.close;
                callBack(res)
            })
        })
    },

    updateOne : function (collection, query, data,arrData){
        MongoClient(process.env['DB_URL'],{useUnifiedTopology:true}, (err, db) => {
            if (err) throw err
            var dbo = db.db(`${process.env['DB_NAME']}`)
            if (arrData != null && data !== null){
                dbo.collection(collection).updateOne(query,{
                    $set: data,
                    $push : arrData,
                    $currentDate : {lastModified:true}
                })
            }if (arrData === null){
                dbo.collection(collection).updateOne(query,{
                    $set: data,
                    $currentDate : {lastModified:true}
                })
            }
            if (data === null){
                dbo.collection(collection).updateOne(query,{
                    $push: arrData,
                    $currentDate : {lastModified:true}
                })
            }
            db.close
        })
    },

    findMany : function (collection,query,callBack){
        MongoClient(process.env['DB_URL'],{useUnifiedTopology:true}, (err, db) => {
            if (err) throw err
            var dbo = db.db(`${process.env['DB_NAME']}`)
            dbo.collection(collection).find(query).toArray((err, res) => {
                if (err) callBack({status:400,data:err.message})
                db.close
                callBack({status:200,data:res})
            })
        })
    },

    findOne : function (collection,query,callBack){
        
        MongoClient(process.env['DB_URL'],{useUnifiedTopology:true}, (err, db) => {
            if (err) throw err
            var dbo = db.db(`${process.env['DB_NAME']}`);
            dbo.collection(collection).findOne(query,(err, res) => {
                if (err) throw err
                db.close
                callBack(res);
            })
        })
    },

    findCount : function (collection, query, options, callBack){
        MongoClient(process.env['DB_URL'],{useUnifiedTopology:true}, (err, db) => {
            if (err) throw err
            var dbo = db.db(`${process.env['DB_NAME']}`);
            dbo.collection(collection).countDocuments(query,options)
            .then(count => {
                callBack(count);
            })
        })
    }
}