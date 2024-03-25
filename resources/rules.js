"use strict";

const rulesData = require('../data/rules'),
  loggers = require('namespaced-console-logger')();

const logger = loggers.get('resources/rules');

function getAllRuless (req, res) {
  logger.info('getAllRuless', req.params.botName);
  rulesData.find({helperName: req.params.botName, query: {}, sort: {name: 1}, limit: req.params.limit}, (err, data) => {
    if (err) {
      res.status(500);
      res.json(err);
      return;
    }

    res.status(200);
    res.json(data);
    return;

  });
}

function get (req, res) {
  logger.info('get', req.params.botname, req.params.id);
  rulesData.find({helperName: req.params.botName, query: {id: req.params.id}, limit: 1}, (err, data) => {
    if (err) {
      res.status(500);
      res.json(err);
      return;
    }

    res.status(200);
    res.json(data || {});
    return;

  });
}

function createNewRules (req, res) {
  logger.info('createNewRules', req.params.botname, req.body);
}

function updateRules (req, res) {
  let rule = req.body;

  logger.info('updateRules req.body', req.params.botname, req.body);

  //TODO:  validate
  delete rule._id;
  rule.id = req.params.id;

  rulesData.saveItem({helperName: req.params.botName}, rule, (err, data) => {
    if (err) {
      res.status(500);
      res.json(err);
      return;
    }
    res.status(200);
    res.json(data || {});
    return;
  });
}

function deleteRules (req, res) {
  rulesData.delete({helperName: req.params.botName, id: req.params.id}, (err, data) => {
    if (err) {
      res.status(500);
      res.json(err);
      return;
    }
    logger.info('deleteRules', req.params.botName);
    res.status(200);
    res.json(data || {});
    return;
  });
}



function rules (app) {
  // Newsletters API
  app.put('/api/rules/:botName/:id', updateRules);
  app.get('/api/rules/:botName/:id', get);
  app.delete('/api/rules/:botName/:id', deleteRules);

  app.get('/api/rules/:botName', getAllRuless);
  app.post('/api/rules/:botName', createNewRules);


}

module.exports = rules;
