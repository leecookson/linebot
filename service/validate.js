"use strict";
var bodyParser = require('body-parser');
var crypto = require('crypto');
const loggers = require('namespaced-console-logger')();

const logger = loggers.get('service/validate');


function signBlob(key, blob) {
  return crypto.createHmac('sha256', key).update(blob).digest('base64');
}

function parseChannelName(req) {
  var pathSegments = req.path.split('/');
  return pathSegments[2].toUpperCase();
}

module.exports = function() {

  return bodyParser.json({
    verify: function(req, res, buffer) {

      var channelName = parseChannelName(req)
      req.channelName = channelName;
      logger.info('channelName', channelName);
      var secret = process.env[channelName + '_SECRET'];
      if (typeof secret != 'string' || secret === '') {
         throw new TypeError('must provide a \'secret\' option');
      }

      if (!req.headers['x-line-signature'])
        throw new Error('No X-Hub-Signature found on request');

      var received_sig = req.headers['x-line-signature'];
      var computed_sig = signBlob(secret, buffer);

      if (received_sig != computed_sig) {
        logger.warn('Recieved an invalid HMAC: calculated:' +
          computed_sig + ' != recieved:' + received_sig);
        throw new Error('Invalid Signature');
      }
    }
  });
};
