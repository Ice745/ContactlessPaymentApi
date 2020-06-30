const axios = require('axios');
const crypto = require('./crypto');
const ObjectId = require('mongodb').ObjectID;
const db = require('./mongodb')


module.exports={
    //Generate UUID version 4
    generateUUID : async function(){
        try {
            let res = await axios(`https://www.uuidgenerator.net/api/version4`)
        let result = (res.data).split("\r\n")
        return result[0];
        } catch (err) {
            console.log(err)
            return null;
        }
    },

    //Generate user ApiKey
    getUserApiKey : async function (reference,apiToken){
        try {
            let res = await axios.post(`${process.env['API_BASE_URL']}/apiuser/${reference}/apikey`,
            {},{
                headers:{
                    'Ocp-Apim-Subscription-Key': apiToken
                }
            })
            return res.data
        } catch (err) {
            console.log(err)
            return;
        }
    },

    //Get user's apikey for collection api
    saveUserKey : async function (userId){
        try {
            db.findOne("users",{_id:ObjectId(userId)}, async content => {
                let colkey = await module.exports.getUserApiKey(crypto.decrypt(content.collection_reference),process.env['API_COLLECTION_TOKEN'])
                let diskey = await module.exports.getUserApiKey(crypto.decrypt(content.disbursement_reference),process.env['API_DISBURSEMENT_TOKEN'])
                let data = {
                    collection_Key: crypto.encrypt(colkey.apiKey),
                    disbursement_Key: crypto.encrypt(diskey.apiKey)
                }
                // console.log(data)
                db.updateOne("users",{_id:ObjectId(userId)},data,null)
            });
        } catch (err) {
            console.log(err)
            return;   
        }

    },

    //Register user on sandbox on collection subscription 
    registerCollection : async function (reference){
        try {
            const uri = `${process.env['API_BASE_URL']}/apiuser`;
            let result = await axios.post(uri,
                {
                providerCallbackHost: "https://webhook.site/d41031b6-1fb0-4b2c-801a-141af55476a7"
                },
                {
                    headers:{
                        'X-Reference-Id' : `${reference}`,
                        'Ocp-Apim-Subscription-Key': `${process.env['API_COLLECTION_TOKEN']}`
                    }
                }
            )
            return result.status;
        } catch (err) {
            console.log(err.response.data)
            return err.response.status
        }
    },

    //Register user on sandbox on disbursement subscription 
    registerDisbursement : async function (reference){
        try {
            const uri = `${process.env['API_BASE_URL']}/apiuser`;
            let result = await axios.post(uri,
                {
                providerCallbackHost: "https://webhook.site/d41031b6-1fb0-4b2c-801a-141af55476a7"
                },
                {
                    headers:{
                        'X-Reference-Id' : `${reference}`,
                        'Ocp-Apim-Subscription-Key': `${process.env['API_DISBURSEMENT_TOKEN']}`
                    }
                }
            )
            return result.status;
        } catch (err) {
            console.log(err.response.data)
            return err.response.status
        }
    },

    //Get payment request status
    checkRequest : async function (referenceId,token){
        try {
            let result = axios(`${process.env['API_COLLECTION_URL']}/v1_0/requesttopay/${referenceId}`,{
                headers :{'Authorization' : `Bearer ${token.access_token}`,
                            'X-Target-Environment' : "sandbox",
                            "Ocp-Apim-Subscription-Key" : process.env['API_COLLECTION_TOKEN']}
            })
            return result
        } catch (err) {
            console.log(err)
            return;
        }
        
    },

    //Get payment transfer status
    checkTransfer : async function (referenceId, token){
        try {
            let result = axios(`${process.env['API_DISBURSEMENT_URL']}/v1_0/transfer/${referenceId}`,{
                headers : {
                    'Authorization' : `Bearer ${token.access_token}`,
                    'X-Target-Environment' : "sandbox",
                    "Ocp-Apim-Subscription-Key" : process.env['API_DISBURSEMENT_TOKEN']
                }
            })

            return result
            
        } catch (err) {
            console.log(err)
            return;
        }
    },

    //Generate user bearer token for disbursement
    getTokenBearer : async function (ref,key){
        try {
            let token = await axios.post(`${process.env['API_DISBURSEMENT_URL']}/token/`,{},
            {
                auth: {
                    'username':ref,
                    'password': key
                },
                headers:{
                    'Ocp-Apim-Subscription-Key': process.env['API_DISBURSEMENT_TOKEN']
                }
            })
            return token.data;
        } catch (err) {
            console.log(err)
            return;
        }
    },

    sendPayment : async function (accessToken,refid,data){
        const header={
            headers :{'Authorization' : `Bearer ${accessToken}`,
            'X-Reference-Id' : refid,
            'X-Target-Environment' : "sandbox",
            "Ocp-Apim-Subscription-Key" : process.env['API_DISBURSEMENT_TOKEN']}
        }
        let response = await axios.post(`${process.env['API_DISBURSEMENT_URL']}/v1_0/transfer`,data,header)
        return response
    },

    requestPayment : async function (accessToken,refid,data){
        const header={
            headers :{'Authorization' : `Bearer ${accessToken}`,
            'X-Reference-Id' : refid,
            'X-Target-Environment' : "sandbox",
            "Ocp-Apim-Subscription-Key" : process.env['API_COLLECTION_TOKEN']}
        }
        let response = await axios.post(`${process.env['API_COLLECTION_URL']}/v1_0/requesttopay`,data,header)
        return response
    },

    //generate user bearer token for collection
    getBearerToken : async function (ref, key){
        try {
            let token = await axios.post(`${process.env['API_COLLECTION_URL']}/token/`,{},
            {
                auth:{
                    'username':ref,
                    'password' : key
                },
                headers:{
                    'Ocp-Apim-Subscription-Key': process.env['API_COLLECTION_TOKEN']
                }
            })
            // console.log(token);
            return token.data
            
        } catch (err) {
            console.log(err)
            return;
        }
    }
}
