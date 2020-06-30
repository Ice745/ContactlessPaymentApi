var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const jwt = require('express-jwt');
const cors = require('cors');
const helmet = require('helmet');
const jwksRsa = require('jwks-rsa');
require('dotenv').config({path:__dirname + '/.env'});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
let adminsRouter = require('./routes/admin');
let merchantsRouter = require('./routes/merchants');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


const corsOptions = {
  origin: `${process.env['UI']}`
}

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache:true,
    rateLimit: true,
    jwksRequestsPerMinute: true,
    jwksUri: `${process.env['JWKURI']}`
  }),

  //validate the audience and issuer 
  audience: `${process.env['AUD']}`,
  issuer: `${process.env['ISS']}`,
  algorithms: ['RS256']
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(checkJwt);
app.use(helmet());
app.use(cors(corsOptions));
// app.use('/', checkJwt, indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin',adminsRouter);
app.use('/api/merchants',merchantsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
