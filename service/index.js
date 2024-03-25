"use strict";
const fs = require('fs'),
  crypto = require('crypto'),
  util = require('util'),

  _ = require('lodash'),
  async = require('async'),

  status = require('./status'),
  send = require('./send'),
  match = require('./match'),
  functions = require('./response_functions'),
  content = require('./content'),
  profileSvc = require('./profile'),
  comprehend = require('./comprehend');

const MAX_HISTORY = 20;

const loggers = require('namespaced-console-logger')();

profileSvc.init();

const logger = loggers.get('service');

function groupLogger(event, channelName) {
  const groupId = event.source ? (event.source.groupId || event.source.roomId) : null;
  if (!groupId) {
    return;
  }
  let message = (event.type === 'message') ? event.message.text : null;
  if (!message) {
    message = 'group ' + event.type;
    console.log('GROUP NO MESSAGE', event);
  }
  var dt = (new Date()).toJSON();
  var logFile = '/var/log/linebot/line-group-' + groupId + '.log';
  fs.writeFile(logFile, dt + ' ' + message + '\n', {flag: 'a'}, function () {});
  const profile = event.source.profile;
  if (profile) {
    logger.info('groupLogger FOUND', profile.id);
    return;
  }
  if (!profile) {
    profileSvc.saveProfile({helperName: channelName}, {id: groupId, type: 'group'}, (err) => {
      logger.info('saved group', groupId);
    });
  }
}

function userLogger(event, channelName) {
  const userId = event.source ? event.source.userId : null;
  if (!userId) {
    return;
  }
  let message = (event.type === 'message') ? event.message.text : null;
  if (!message) {
    message = 'user ' + event.type;
  }
  var dt = (new Date()).toJSON();
  var logFile = '/var/log/linebot/line-user-' + userId + '.log';
  fs.writeFile(logFile, dt + ' ' + message + '\n', {flag: 'a'}, function () {});

  const profile = event.source.profile;
  if (profile) {
    logger.info('userLogger FOUND', profile.id);
    return;
  }
  if (!profile) {
    profileSvc.saveProfile({helperName: channelName}, {id: userId, type: 'user'}, (err) => {
      logger.info('saved user', userId);
    });
  }
}

function updateHistory (channelName, event) {
  if (event.source && event.source.profile) {
    if (event.source.profile.history) {
      logger.info('UPDATE HISTORY FOUND');
    } else {
      logger.info('UPDATE HISTORY CREATE');
      event.source.profile.history = [];
    }

    let history = event.source.profile.history;
    history.push(event.message.text);

    if (history.length > MAX_HISTORY) {
      event.source.profile.history = history.slice(history.length - MAX_HISTORY);
    }
    profileSvc.saveProfile({helperName: channelName}, event.source.profile, (err) => {
      logger.info('UPDATED HISTORY');
    });
  }
}

const service = module.exports = {
  handleWebHook: function (req) {
    var channelName = this.parseChannelName(req);

    //logger.info('handle channelName', channelName);

    //logger.info('req', req.headers, util.inspect(req.body, {depth: null}));
    logger.info(util.inspect(req.body, {depth: null}));

    const events = req.body.events;
    if (_.isArray(events)) {
      events.forEach((event) => {

        this.handleEvent(event, channelName);
      });
    }
  },

  handleEvent: function (event, channelName) {
    let sourceId = null;
    if (event.source) {
      if (event.source.type === 'group' && event.source.groupId) {
        sourceId = event.source.groupId;
      } else if (event.source.type === 'user' && event.source.userId) {
        sourceId = event.source.userId;
      }
    }

    const sourceProfile = sourceId ? profileSvc.getProfile({helperName: channelName}, sourceId) : {};

    logger.info('handleEvent source', sourceId, sourceProfile);
    if (event.source) {
      event.sourceId = sourceId;
      event.source.profile = sourceProfile;
    }

    switch (event.type)
    {
      case 'join':
        this.handleJoin(event, channelName);
        groupLogger(event, channelName);
        break;
      case 'unjoin':
        groupLogger(event, channelName);
        break;
      case 'follow':
        this.handleFollow(event, channelName);
        userLogger(event, channelName);
        break;
      case 'unfollow':
        userLogger(event, channelName);
        break;
      case 'message':
        groupLogger(event, channelName);
        userLogger(event, channelName);
        var message = event.message;
        // filter by type: text, take first message
        if (message.type === 'image') {
          this.handleImage(event, channelName);
        } else if (message.type === 'text') {
          this.handleText(event, channelName);
        } else if (message.type === 'sticker') {
          this.handleSticker(event, channelName);
        }
        break;
      default:
        break;
    }
  },

  // input starting with literal "hm " will be treated as a command
  handleText: function (event, channelName) {
    let sendThis = [];
    if (event && event.source && event.source.profile && event.source.profile.eliza) {
      var elizaResponse = {type: 'function', 'function': 'ELIZA', text: event.message.text};
      functions.respond(channelName, elizaResponse, event.source, (err, response) => {
        logger.info('response', response);
        response.forEach((item) => {
          sendThis.push(item);
        });
        send.reply(sendThis, event.replyToken, channelName);
      });
      return;
    }

    updateHistory(channelName, event);

    if (event && event.message && typeof event.message.text === 'string') {
      event.message.text = event.message.text.trim();
    }

    let reply = match.find(event.message.text, event.source.profile, channelName);

    if (reply && _.isArray(reply.response)) {
      logger.info('handleText reply', reply, event.source);
      const isUnhush = reply.text.toLowerCase() === 'unhush';
      let isHushed = false;
      const now = new Date();
      if (event && event.source && event.source.profile && event.source.profile.hushUntil) {

        const hushUntil = event.source.profile.hushUntil;
        logger.info('hushUntil', hushUntil, event.sourceId, 'isUnhush', isUnhush);
        if (hushUntil.getTime() > now.getTime()) {
          isHushed = true;
        }
      }
      if (event && event.source && event.source.profile && event.source.profile.elizaUntil) {
        const elizaUntil = event.source.profile.elizaUntil;
        logger.info('elizaUntil', elizaUntil, event.sourceId);
        if (elizaUntil.getTime() > now.getTime()) {
          profileSvc.saveProfile({helperName: channelName}, event.source.profile, (err) => {
            logger.info('eliza expiring');
          });
        }
      }

      if (isHushed && !isUnhush) {
        logger.info('isHushed', event.sourceId, isHushed);
        return;
      }

      async.eachSeries(reply.response, (r, next) => {

        if (r.type === 'text') {
          sendThis.push(r);
          next();
        } else if (r.type === 'image') {
          if (r.originalContentUrl !== 'not set') {
            sendThis.push(r);
            next();
          } else {
            next();
          }
        } else if (r.type === 'sticker') {
          sendThis.push(r);
          next();
        } else if (r.type === 'function') {
          logger.info('handleText function type', reply, r);
          r.text = reply.text;
          functions.respond(channelName, r, event.source, (err, response) => {
            logger.info('response', response);
//            sendThis.push(response);
            response.forEach((item) => {
              sendThis.push(item);
            });
            next();
          });
        }
      }, (err) => {
        send.reply(sendThis, event.replyToken, channelName);
      });
    }
  },

  //
  handleSticker: function (event, channelName) {
    let reply = match.find('STICKER_WARNING', event.source.profile, channelName);

    logger.info('STICKER reply', reply);
    if (reply && _.isArray(reply.response)) {
      send.reply(reply.response, event.replyToken, channelName);
    }
  },

  //
  handleImage: function (event, channelName) {

    logger.info('IMAGE', event);
    //content.getImage(event.message, channelName);
  },

  handleFollow: function (event, channelName) {
    logger.info('FOLLOW handler', event, channelName);
    let reply = match.find('follow', event.source.profile, channelName);

    logger.info('FOLLOW reply', reply);
    if (reply && _.isArray(reply.response)) {
      send.reply(reply.response, event.replyToken, channelName);
    }
  },

  handleJoin: function (event, channelName) {
    let reply = match.find('join', event.source.profile, channelName);

    logger.info('JOIN reply', reply);
    if (reply && _.isArray(reply.response)) {
      send.reply(reply.response, event.replyToken, channelName);
    }
  },

  parseChannelName: function (req) {
    var pathSegments = req.path.split('/');
    return pathSegments[2].toUpperCase();
  }

};
