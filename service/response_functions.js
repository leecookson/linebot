"use strict";
const _ = require('lodash');

const status = require('./status'),
  dynamicRules = require('./dynamic_rules'),
  profileSvc = require('./profile'),
  ElizaBot = require('./elizabot'),
  giphy = require('./giphy'),
  comprehend = require('./comprehend'),
  loggers = require('namespaced-console-logger')();

const logger = loggers.get('service/response_functions');

var hushTimers = {};
var elizaBots = {};

var functions;

const functionMap = {
  'DYNAMIC': 'dynamic',
  'GAMETIME': 'gametime',
  'ELIZAON': 'elizaOn',
  'ELIZAOFF': 'elizaOff',
  'ELIZA': 'eliza',
  'GIPHY': 'giphy',
  'SENTIMENT': 'sentiment',
  'HISTORY': 'history',
  'HUSH': 'hush',
  'UNHUSH': 'unhush',
  'ALERTS': 'alertStatus',
  'ALERTSON': 'alertsOn',
  'ALERTSOFF': 'alertsOff',
  'INFO': 'infoStatus',
  'INFOON': 'infoOn',
  'INFOOFF': 'infoOff'
};

var helpers = [
  'HELPER',
  'CAMELOT',
  'GERMAN',
  'GERMAN2',
  'BETA'
];

functions = module.exports = {

  respond: (helperName, response, source, cb) => {
    if (response.type !== 'function') {
      logger.warn('Unexpected response type', response.type);
      return cb(null, {});
    }

    //logger.info('response', response);
    //logger.info('response["function"]', response['function']);
    //logger.info('functionMap[response["function"]]', functionMap[response['function']]);

    functions[functionMap[response['function']]](helperName, response, source, (err, returnMessage) => {
      logger.info('function', response['function'], err, 'returnMessage', returnMessage);

      return cb(err, returnMessage);
    });
  },

  gametime: (helperName, response, source, cb) => {
    var dt = new Date();
    dt = dt.toString().split(' ').slice(0, 5).join(' ')
    return cb(null, [{
      type: 'text',
      text: 'Game Time: ' + dt
    }]);
  },

  hush: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    const hushUntil = new Date();
    hushUntil.setTime(hushUntil.getTime() + 1000 * 60 * 60);
    source.profile.hushUntil = hushUntil;

    profileSvc.updateProfile({helperName: helperName}, source.profile, (err) => {

      return cb(null, [{
        type: 'text',
//        text: 'Hushing for 60 minutes'
        text: 'You will regret hushing me. (for 60 minutes)'
      }]);
    });
  },

  unhush: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }

    const hushUntil = new Date();
    source.profile.hushUntil = hushUntil;

    profileSvc.updateProfile({helperName: helperName}, source.profile, (err) => {
      return cb(null, [{
        type: 'text',
        text: 'Thanks!'
      }]);
    });

  },

  alertStatus: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }

    if (source.profile.disableAlertUpdates) {
      return cb(null, []);
    }
    let alertStatus = source.profile.alerts;
    if (alertStatus !== false) {
      alertStatus = 'ON';
    } else {
      alertStatus = 'OFF';
    }

    return cb(null, [{
      type: 'text',
      text: 'Alerts from Fellowship are ' + alertStatus + '\nTo turn on and off, use "alerts on" or "alerts off"'
    }]);
  },

  alertsOn: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    if (source.profile.disableAlertUpdates) {
      return cb(null, []);
    }
    source.profile.alerts = true;

    profileSvc.updateProfile({helperName: helperName}, source.profile, (err) => {

      return cb(null, [{
        type: 'text',
        text: 'Alerts from Fellowship are ON\nType "alerts off" to disable'
      }]);
    });
  },

  alertsOff: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    if (source.profile.disableAlertUpdates) {
      return cb(null, []);
    }
    source.profile.alerts = false;

    profileSvc.updateProfile({helperName: helperName}, source.profile, (err) => {

      return cb(null, [{
        type: 'text',
        text: 'Alerts from Fellowship are OFF\nType "alerts on" to enable'
      }]);
    });
  },

  infoStatus: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }

    if (source.profile.disableInfoUpdates) {
      return cb(null, []);
    }
    let infoStatus = source.profile.info;
    if (infoStatus !== false) {
      infoStatus = 'ON';
    } else {
      infoStatus = 'OFF';
    }

    return cb(null, [{
      type: 'text',
      text: 'Info mode id ' + infoStatus + '\nTo turn on and off, use "info on" or "info off"'
    }]);
  },

  infoOn: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    if (source.profile.disableInfopdates) {
      return cb(null, []);
    }
    source.profile.info = true;

    profileSvc.updateProfile({helperName: helperName}, source.profile, (err) => {

      return cb(null, [{
        type: 'text',
        text: 'Info mode is ON\nType "info off" to disable'
      }]);
    });
  },

  infoOff: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    if (source.profile.disableInfoUpdates) {
      return cb(null, []);
    }
    source.profile.info = false;

    profileSvc.updateProfile({helperName: helperName}, source.profile, (err) => {

      return cb(null, [{
        type: 'text',
        text: 'Info mode is OFF\nType "info on" to enable'
      }]);
    });
  },

  elizaOn: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    if (source.profile.disableEliza) {
      return cb(null, []);
    }
    source.profile.eliza = true;

    const elizaUntil = new Date();
    elizaUntil.setTime(elizaUntil.getTime() + 1000 * 60 * 15);
    source.profile.elizaUntil = elizaUntil;

    var eBot = elizaBots[source.profile.id] = {};

    eBot.eliza = new ElizaBot();
    var initial = eBot.eliza.getInitial();

    profileSvc.updateProfile({helperName: helperName}, source.profile, (err) => {

      return cb(null, [{
        type: 'image',
        originalContentUrl: 'https://s.hobbitmaster.us/line/TurfanFull.jpg',
        previewImageUrl: 'https://s.hobbitmaster.us/line/TurfanPreview.jpg',
//originalContentUrl: 'https://s.hobbitmaster.us/line/lord_of_the_rings_gandalf_pipe_tree_lay_think_thinking_hobbit_smoke_smokingFull.jpg',
//        previewImageUrl: 'https://s.hobbitmaster.us/line/lord_of_the_rings_gandalf_pipe_tree_lay_think_thinking_hobbit_smoke_smokingPreview.jpg'
      },{
        type: 'text',
        text: initial
      }]);
    });
  },

  elizaOff: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    if (source.profile.disableEliza) {
      return cb(null, []);
    }
    source.profile.eliza = false;


    var eBot = elizaBots[source.profile.id];
    var final;
    if (eBot) {
      final = eBot.eliza.getFinal();
    } else {
      final = 'bye';
    }

    profileSvc.updateProfile({helperName: helperName}, source.profile, (err) => {
      return cb(null, [{
        type: 'text',
        text: final
      }]);
    });
  },

  eliza: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    if (source.profile.disableEliza) {
      return cb(null, []);
    }

    var eBot = elizaBots[source.profile.id];
    if (!eBot) {
      return functions.elizaOff(helperName, response, source, cb);
    }
    var reply = eBot.eliza.transform(response.text || 'hi');
    if (eBot.eliza.quit) {
      // last user input was a quit phrase
      functions.elizaOff(helperName, response, source, cb);
    } else {

      return cb(null, [{
        type: 'text',
        text: reply
      }]);
    }
  },

  history: (helperName, response, source, cb) => {
    if (!source || !source.profile || !source.profile.history) {
      return cb(null, []);
    }

    return cb(null, [{
      type: 'text',
      text: source.profile.history.join('\n')
    }]);
  },

  sentiment: (helperName, response, source, cb) => {
    if (!source || !source.profile || !source.profile.history) {
      return cb(null, []);
    }

    comprehend.getSentiment(source.profile.history.join('\n'), (err, sentiment) => {
      if (err) {
        return cb(null, []);
      }
      logger.info('SENTIMENT DATA', sentiment);
      return cb(null, [{
        type: 'text',
        text: sentiment.Sentiment + ', positive: ' + sentiment.SentimentScore.Positive +
            ', negative: ' + sentiment.SentimentScore.Negative
      }]);
    });
  },

  giphy: (helperName, response, source, cb) => {
    if (!source || !source.profile) {
      return cb(null, []);
    }
    if (source.profile.disableGiphy) {
      return cb(null, []);
    }

    giphy.search({q: 'test'}, (err, response) => {
      if (err) {
        return cb(null, []);
      }

      logger.info('GIPHY REPSONSE', source, response);
      return cb(null, [{
        type: 'text',
        text: response.data[0].images.fixed_width.url + '\n' + 'Powered By Giphy'
      }]);
    });
  },

  dynamic: (helperName, response, source, cb) => {
    var functionName;
    if (typeof response.function === 'string') {
      functionName = response.function.toLowerCase();
    }
    if (typeof response.text === 'string') {
      functionName = response.text.toLowerCase();
    }
    const rules = dynamicRules.getRules({helperName: helperName});

    //logger.warn('####### TRYING TO find match in dynamicRules', functionName, rules);
    var match = _.find(rules, (item, key) => {
      return item.name === functionName;
    });
    if (match) {
      logger.info('#######  found match in dynamicRules', match);
      return cb(null, match.response);
    } else {
      return cb(null, []);
    }
  }

};

dynamicRules.init({helpers: helpers});
