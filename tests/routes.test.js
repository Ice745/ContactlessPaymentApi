const request = require('supertest');
const app = require('../app');

describe('Post Endpoint', () => {
    it('Add a new user',  async ()=>{
        const res = await request(app)
            .post('/api/admin/register/user')
            .send({
                "name":"Samara Morgan",
                "account": "user",
                "msisdn" : "0248632941",
                "id_type":"passport",
                "id_number":"G2717",
                "balance": 50,
                "currency":"GHS"
            })
            // console.log(res)
        expect(res.body).toMatchObject({code: '01', message: 'User created', data: []})
    },10000)
})