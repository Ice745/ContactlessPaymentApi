// const jwt = require('express-jwt');
// // const jwtAuthz = require('express-jwt-authz');
// const jwksRsa = require('jwks-rsa');

// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
// const checkJwt = jwt({
//     secret: jwksRsa.expressJwtSecret({
//       cache:true,
//       rateLimit: true,
//       jwksRequestsPerMinute: true,
//       jwksUri: `https://ice745.auth0.com/.well-known/jwks.json`
//     }),

//     //validate the audience and issuer 
//     audience: `https://quickstart/api`,
//     issuer: 'https://ice745.auth0.com/',
//     algorithms: ['RS256']
// });

// module.exports = checkJwt;

  