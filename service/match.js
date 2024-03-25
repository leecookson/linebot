"use strict";
const _ = require('lodash'),
  natural = require('natural'),
  loggers = require('namespaced-console-logger')(),
  dynamicRules = require('./dynamic_rules');

const logger = loggers.get('service/match');

const keepWords = [
  't1', 't2', 't3', 't4', 't5', 'cs', 'fs'
];

var rules = {};

const match = module.exports = {

  find: function (text, profile, channelName) {
    if (!text) {
      logger.info('no text');
      return null;
    }

    let config = _.clone(this.getConfig(channelName));

    if (true || config.dynamicEnabled) {
      var dynText = text;
      if (typeof dynText === 'string') {
        dynText = dynText.toLowerCase();
      }
      const dRules = dynamicRules.getRules({helperName: channelName});
      _.each(dRules, (dRule, dKey) => {
        config.push(dRule);
      });
    }
    var found;
    config.forEach((mainRule) => {
      if (found) return;
      if (mainRule.disabled) {
        return;
      }

      if (mainRule.rules) {
        if (mainRule.rules.OR) {
          if (!match.roomFilter(profile, mainRule)) return;

          mainRule.rules.OR.forEach((orRule) => {
            if (found) return;
            if (!match.roomFilter(profile, orRule)) return;
            if (match.matcher(text, orRule) ) {
              found = mainRule;
            }
          });
        }
      } else {
        if (!match.roomFilter(profile, mainRule)) return;
        if (match.matcher(text, mainRule) ) {
          found = mainRule;
        }
      }
    });


    if (found) {
      found.text = text;
      //logger.info('match', found);
    } else {
      //logger.info('no match', text, channelName);
    }


    return found;
  },

  matcher: function (text, rule) {
    const MIN_WORD_LENGTH = 2;

    text = text.trim().toLowerCase();  //TODO: trim punctuation

    if (rule.expires && typeof rule.expires === 'string' && rule.expires.length > 9) {
      const now = new Date();
      if (rule.expires < now.toJSON()) {
        return false;
      }
    }

    if (rule.disabled) {
      return false;
    }

    //logger.info('MATCHER RULE', text, rule);
    if (rule.exactMatch && text === rule.exactMatch) {
      return true;
    }

    if (rule.contains && text.indexOf(rule.contains) !== -1) {
      return true;
    }

    if (rule.keywords) {
      const natural = require('natural'),
        tokenizer = new natural.WordTokenizer();

      let words = tokenizer.tokenize(text);
      let wordsLengthValid = _.filter(words, (w) => {
        return (w.length > MIN_WORD_LENGTH) || (keepWords.indexOf(w) != -1);
      });

      let wordsStemmed = _.map(wordsLengthValid, (w) => {
        return natural.PorterStemmer.stem(w);
      });

      let wordsToMatch = _.union(wordsLengthValid, wordsStemmed);

      //logger.info('MATCHES WORDS', wordsToMatch, rule);

      let intersect = rule.keywords.filter(function(n) {
        return wordsToMatch.indexOf(n) !== -1;
      });

      //logger.info('MATCHES INTERSECT', wordsToMatch, rule);
      if (intersect && intersect.length === rule.keywords.length) {
        //logger.info('MATCHES RESULT', true);
        return true;
      }
    }
    //logger.info('MATCHES RESULT', false);
    return false;
  },

  getConfig: function (channelName) {
    //logger.info('getConfig', channelName);
    if (rules[channelName]) {
      return rules[channelName];
    } else {
      const config = require('../config/rules-' + channelName + '.json');
      rules[channelName] = config;
      return config;
    }
  },

  roomFilter: function (profile, rule) {
    if (!rule || !profile || (!rule.roomsOnly && !rule.roomsNever)) {
      return true;
    }
    if (rule && (rule.roomsOnly || rule.roomsNever)) {
      //logger.info('ROOMFILTER', profile, rule.roomsOnly, rule.roomsNever, rule.name);
    }
    if (!profile || !profile.id || !rule) {
      return true;
    }

    // return false if roomsOnly && profile is in not in roomsOnly
    if (_.isArray(rule.roomsOnly) && !_.isEmpty(rule.roomsOnly) && !rule.roomsOnly.find((item) => {return item.toLowerCase() === profile.id.toLowerCase()})) {
      //logger.info('ROOMFILTER ROOMSONLY OUT');
      return false;
    }

    // return false if roomsNever and profile is in roomsNever
    if (_.isArray(rule.roomsNever) && !_.isEmpty(rule.roomsNever) && rule.roomsNever.find((item) => {return item.toLowerCase() === profile.id.toLowerCase()})) {
      //logger.info('ROOMFILTER ROOMSNEVER IN');
      return false;
    }

    //logger.info('ROOMFILTER TRUE');
    return true;
  }
};
