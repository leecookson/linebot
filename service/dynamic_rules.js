"use strict";

const _ = require('lodash'),
  responseData = require('../data/response'),
  loggers = require('namespaced-console-logger')();

const logger = loggers.get('service/dynamic_rules');

var dynamicRules = {};

module.exports = {
  init: (options) => {
    const helpers = options.helpers;

    helpers.forEach(function (helperName) {
      setInterval(function () {
        module.exports.loadRules({helperName: helperName});
      }, 30000);

      module.exports.loadRules({helperName: helperName});
    });

  },

  getRules: (options) =>  {
    return dynamicRules[options.helperName];
  },

  loadRules: (options) => {
    const helperName = options.helperName;

    if (!dynamicRules[helperName]) {
      dynamicRules[helperName] = {};
    }

    responseData.find({helperName: helperName}, (err, allRules) => {
      logger.info('DYNAMIC RESPONSE RELOAD', allRules.length, helperName);
      //logger.info('DYNAMIC RESPONSE RELOAD', allRules.length, allRules, helperName);
      allRules.forEach((item) => {
        if (typeof item.name === 'string') {
          item.name = item.name.toLowerCase();
        }
        if (item.match && item.match === 'fuzzy') {
          item.keywords = [item.name];
        } else if (item.match && item.match === 'contains') {
          item.contains = item.name;
        } else {
          item.exactMatch = item.name;
          //logger.info('dynamic', item ? item.rules : 'no rules');
        }

        dynamicRules[helperName][item.id] = item;
      });
    });
  }

}
