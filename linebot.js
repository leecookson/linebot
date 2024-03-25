require('dotenv-safe').load({allowEmptyValues: true, silent: true});

const _ = require('lodash'),
  express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  fileUpload = require('express-fileupload'),
  authMiddleware = require('./auth'),
  auth = require('basic-auth'),
  cors = require('cors'),
  profileSvc = require('./service/profile');
  service = require('./service');

const loggers = require('namespaced-console-logger')();

const logger = loggers.get('linebot');

const authConfig = require('./etc/auth.json');

function basic (req, res, next) {
  var user = auth(req);
  if (!user) {
    res.set('WWW-Authenticate', 'Basic realm="LinebotRealm"');
    return res.status(401).send();
  }
  var authRecord = _.find(authConfig, {user: user.name});
  var success = authRecord && authRecord.password === user.pass;
  console.log('success', authRecord ? authRecord.user : authRecord, success);
  if (!success) {
    res.set('WWW-Authenticate', 'Basic realm="LinebotRealm"');
    return res.status(401).send();
  }
  req.user = {
    username: user,
    helpers: authRecord.helpers,
    tools: authRecord.tools
  };
  return next();
}

const response = require('./resources/response'),
  rules = require('./resources/rules'),
  push = require('./resources/push'),
  validate = require('./service/validate');
/*
var basic = auth.basic({
    realm: "LinebotRealm"
  }, (username, password, callback) => {
    //TODO: if we can get the path/lineBot in here, we can check for specific access per user
    // Custom authentication
    // Use callback(error) if you want to throw async error.
    authRecord = _.find(authConfig, {user: username});
    success = authRecord && authRecord.password === password;
    logger.info('login attempt', username, success);
    callback(success);
  }
);
*/
const app = express();

var corsOptions = {
  origin: 'http://www.hobbitmaster.us'
};

app.use(morgan(':date[iso] (http) ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ::remote-addr :response-time ms'));
app.use(bodyParser.json()); // for parsing application/json
app.use(cors(corsOptions)); // for parsing application/json
app.use(fileUpload()); // for parsing application/json

app.post('/hooks/master/', [validate()], function (req, res) {
  service.handleWebHook(req, res);
  res.status(200).end();
});

app.post('/hooks/helper/', [validate()], function (req, res) {
  service.handleWebHook(req, res);
  res.status(200).end();
});

app.post('/hooks/german/', [validate()], function (req, res) {
  service.handleWebHook(req, res);
  res.status(200).end();
});

app.post('/hooks/german2/', [validate()], function (req, res) {
  service.handleWebHook(req, res);
  res.status(200).end();
});

app.post('/hooks/beta/', [validate()], function (req, res) {
  service.handleWebHook(req, res);
  res.status(200).end();
});

app.post('/hooks/camelot/', [validate()], function (req, res) {
  service.handleWebHook(req, res);
  res.status(200).end();
});

// hooks before this middleware so that auth doesn't block them
//app.use(auth.connect(basic));
app.use(basic);
app.use(authMiddleware.getMiddleware(authConfig));

response(app);
rules(app);
push(app);


app.listen(process.env.PORT, () => {
  logger.info('listening on port', process.env.PORT);
});
