"use strict";

const pushSvc = require('../service/push'),
  loggers = require('namespaced-console-logger')();

const logger = loggers.get('resources/push');

function pushMessage (req, res) {
  let body = req.body;

  logger.info('pushMessage req.body', req.params.botName, body, req.user);

  if (req.params.type) {
    let types = {};
    if (req.params.type === 'all') {
      types = {groups: true, users: true, fellowship: true};
    } else {
      types[req.params.type] = true;
    }
    logger.info('push type detected', req.params.type, types);

    pushSvc.pushAll(types, body.message, req.params.botName, body.imageUrls);

  } else {

    pushSvc.push(body.recipientId, body.message, req.params.botName, body.imageUrls);
  }

  res.status(201);
  res.send({status: 'accepted'});
}


function push (app) {
  app.post('/api/push/:botName', pushMessage);
  app.post('/api/push/:botName/:type', pushMessage);

}

module.exports = push;
