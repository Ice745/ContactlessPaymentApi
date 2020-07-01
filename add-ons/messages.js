const twilio = require('twilio')
const accSid = ''
const auth = ''

const client = twilio(accSid,auth);
let send = function (sender,reciepient,amount,balance){
    
    client.messages.create({
        body:`You have transferred GHS ${amount} to ${reciepient} \n\nYour new balance is ${balance}`,
        to: `${sender}`,
        from: ''
    })
    .then((message)=> {
        console.log(message.sid)
        console.log(message.status)
    })
}

module.exports = {send : send}
