const crypto = require('crypto'); 
const algorithm = 'aes-256-cbc';  
const key = crypto.createHash('sha256').update(String(process.env['KEY'])).digest('base64').substr(0,32) 
const iv = crypto.randomBytes(16); 

const encrypt = function (text){
    let cipher = crypto.createCipheriv(algorithm,Buffer.from(key),iv)
    let encrypted = cipher.update(text,'utf8','hex') + cipher.final('hex'); 
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') }; 
}


const decrypt = function (text){ 
    let new_iv = Buffer.from(text.iv, 'hex'); 
    let encryptedText = Buffer.from(text.encryptedData, 'hex'); 
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), new_iv); 
    let decrypted = decipher.update(encryptedText,'hex','utf8') + decipher.final('utf8'); 
    return decrypted; 
} 

module.exports = {
    encrypt : encrypt,
    decrypt : decrypt
};
