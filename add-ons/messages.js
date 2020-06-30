const twilio = require('twilio')
const accSid = 'AC11c7632acaf27e1572fec285c9a1c4d4'
const auth = '5d2dd50e844d8fc9af2c990e09cac395'

const client = twilio(accSid,auth);
let send = function (sender,reciepient,amount,balance){
    
    client.messages.create({
        body:`You have transferred GHS ${amount} to ${reciepient} \n\nYour new balance is ${balance}`,
        to: `${sender}`,
        from: '+14842323311'
    })
    .then((message)=> {
        console.log(message.sid)
        console.log(message.status)
    })
}

module.exports = {send : send}