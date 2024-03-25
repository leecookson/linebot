"use strict";
const _ = require('lodash'),
  async = require('async'),
  request = require('request'),
  profileSvc = require('./profile'),
  loggers = require('namespaced-console-logger')();

const logger = loggers.get('service/push');

const LINE_SERVICE_PUSH = process.env.LINE_SERVICE + '/message/push';
const LINE_SERVICE_RATE = 60;

module.exports = {
  /*
   * types: {users: true, groups: true, fellowship: true}
   *
   *  fellowship: true will need to look at item.attributes rather than type
   */
  pushAll: function (types, message, channelName, imageUrls) {
    const profiles = profileSvc.getAllProfiles({helperName: channelName});
    logger.info('pushAll', types, message, 'channelName', channelName, 'imageUrls', imageUrls);

    async.eachSeries(profiles, (item, next) => {
     if (types[item.type + 's'] && item.alerts !== false) {
       //logger.info('do push', item, message);
       this.push(item.id, message, channelName, imageUrls);
       setTimeout(next, LINE_SERVICE_RATE);
     } else {
       next();
     }
   });

  },

  push: function (recipientId, message, channelName, imageUrls) {

    if (!_.isArray(message)) {
      message = message;
    }
    //recipientId = recipientId.toUpperCase();

    logger.info('push', recipientId, 'message', message, 'channelName', channelName, 'imageUrls', imageUrls);
    if ((message || imageUrls) && recipientId) {

      const token = process.env[channelName + '_CHANNEL_ACCESS_TOKEN'];

      const headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer ' + token
      };

      const messages = [];
      if (message && message.length) {
        messages.push({type: 'text', text: message});
      }
      if (imageUrls && imageUrls.originalContentUrl && imageUrls.previewImageUrl) {
        messages.push({
          type: 'image',
          originalContentUrl: imageUrls.originalContentUrl,
          previewImageUrl: imageUrls.previewImageUrl
        });
      }

      const formData = {
        to: recipientId,
        messages: messages
      };

      logger.info('request PUSH', headers, formData);
      request.post(LINE_SERVICE_PUSH, {headers: headers, json: formData}, (err, res, body) => {
        if (err) {
          logger.error('error sending reply', err, body);
          return;
        }
        logger.info('successful reply:', formData, res.statusCode, LINE_SERVICE_PUSH, body, token);
      });
    }
  },

  pushImage: function (message, replyToken) {
    // we can reply with an image, but it has to be a CDN URL...we have the images in /var/linebot that have been captured
  }
};
