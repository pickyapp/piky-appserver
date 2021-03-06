const express = require('express');
const path = require('path');
const logger = require('morgan');
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { errWrap } = require('./config/basic');
// const cors = require('cors');

mongoose.connect(process.env.PICKY_DB_URL || 'mongodb://localhost/test', { useNewUrlParser: true });
mongoose.Promise = global.Promise;

const db = mongoose.connection;

db.once('open', () => {
  console.log('Connected to MongoDB');
});

db.on('error', (err) => console.log(err));

const app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// PASSPORT
app.set('trust proxy');

app.use(cookieSession({
  name: 'user',
  maxAge: 24 * 60 * 60 * 1000, // One day in milliseconds
  keys: [process.env.COOKIE_SESSION_KEYS],
  httpOnly: false,
  secure: false,
  domain: process.env.COOKIE_DOMAIN,
  secureProxy: false
}));

app.use((req, res, next) => {
  /* req.app.get('env') === 'development' */
  if (req.headers.origin === 'https://www.piky.me') {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.piky.me');
    // if (req.headers.origin !== 'https://www.piky.me') return; // TODO: throw 403 Forbidden
  } else if (req.headers.origin === 'http://localhost:4200') {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  } else if (req.headers.origin === 'https://www.vinitsoni.com') {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.vinitsoni.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Add headers (sent from CORS request) here
  // TODO: switch to use the cors npm package
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get('/', (req, res, next) => {
  req.session.game = 'Piky';
  res.send('Piky API');
});

app.get('/testing', (req, res, next) => {
  req.session.game = 'Piky';
  res.send('Piky API working on testing endpoint.');
});

app.post('/postcheck', (req, res, next) => {
  res.send({ message: 'success' });
});

require('./routes/game-sessions')(app);
require('./routes/questions')(app);
require('./routes/rooms')(app);
require('./routes/quiz')(app);

// catch 404 and forward to error handler
app.use(errWrap((req, res, next) => {
  const err = new Error('Endpoint Not Found');
  err.status = err.status ? err.status : 404;
  throw err;
}));

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error
  console.log('Error: ', err.message);
  res.status(err.status || 500);
  res.send({ message: err.message });
});

module.exports = app;
