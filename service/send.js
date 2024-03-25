"use strict";
const _ = require('lodash');
const request = require('request');
const loggers = require('namespaced-console-logger')();

const logger = loggers.get('service/send');


const LINE_SERVICE_REPLY = process.env.LINE_SERVICE + '/message/reply';

module.exports = {
  reply: function (response, replyToken, channelName) {
    if (!_.isArray(response)) {
      response = [ response ];
    }
    logger.info('reply', replyToken, 'response', response, 'channelName', channelName);
    if (response && replyToken) {

      const now = new Date();
      response = _.filter(response, (m) => {
        if (m.expires && typeof m.expires === 'string' && m.expires.length > 9) {
          if (m.expires < now.toJSON()) {
            return false;
          }
        }
        return true;
      });

      if (response.length === 0) {
        return;
      }

      var token = process.env[channelName + '_CHANNEL_ACCESS_TOKEN'];

      var headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer ' + token
      };

      var formData = {
        replyToken: replyToken,
        messages: response
      };

      request.post(LINE_SERVICE_REPLY, {headers: headers, json: formData}, (err, res, body) => {
        if (err || (res && res.statusCode && res.statusCode !== 200)) {
          logger.error('error sending reply', err, body);
          return;
        }
        logger.info('successful reply:', formData.message, res.statusCode, LINE_SERVICE_REPLY/*, formData*/);
      });
    }
  },

  replyImage: function (response, replyToken) {
    // we can reply with an image, but it has to be a CDN URL...we have the images in /var/linebot that have been captured
  }
};
