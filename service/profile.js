"use strict";

const _ = require('lodash'),
  profilesData = require('../data/profiles'),
  request = require('request'),
  loggers = require('namespaced-console-logger')();


const LINE_SERVICE_PROFILE = process.env.LINE_SERVICE + '/profile';

const channelName = 'HELPER';

const logger = loggers.get('service/profile');

var helpers = [
  'HELPER',
  'CAMELOT',
  'GERMAN',
  'GERMAN2',
  'BETA'
];

var profilesCache = {};

var profiles = module.exports = {
  init: () => {

    setInterval(function () {
      helpers.forEach((helperName) => {
        module.exports.loadProfiles({helperName: helperName});
      });
    }, 30000);

    helpers.forEach((helperName) => {
      module.exports.loadProfiles({helperName: helperName});
    });

  },

  saveProfile: (options, profile, cb) =>  {
    if (!profile) {
      return cb();
    }
    delete profile._id;
    if (profile && profile.type === 'user' && !profile.displayName) {
      logger.info('save existing profile');
      const profileId = profile.groupId || profile.userId || profile.roomId;
      profiles.getUserProfile(options, profile.id, (err, lineProfile) => {
        if (!err && lineProfile.displayName) {
          profile.displayName = lineProfile.displayName;
          profile.statusMessage = lineProfile.statusMessage;
          profile.pictureUrl = lineProfile.pictureUrl;
          profilesData.saveItem({helperName: options.helperName}, profile, cb);
        } else {
          profilesData.saveItem({helperName: options.helperName}, profile, cb);
        }
      });
    } else {
      //logger.info('Save new profile');
      profilesData.saveItem({helperName: options.helperName}, profile, cb);
    }
  },

  updateProfile: (options, profile, cb) => {
    if (!profile) {
      return cb();
    }
    delete profile._id;
    profilesData.saveItem({helperName: options.helperName}, profile, cb);
  },

  getProfile: (options, profileId) =>  {
    if (profilesCache[options.helperName]) {
      return profilesCache[options.helperName][profileId];
    } else {
      return undefined;
    }
  },

  getAllProfiles: (options) =>  {
    return profilesCache[options.helperName];
  },

  loadProfiles: (options) => {

    if (!profilesCache[options.helperName]) {
      profilesCache[options.helperName] = {};
    }

    profilesData.find({helperName: options.helperName}, (err, allProfiles) => {
      logger.info('PROFILES RELOAD', allProfiles.length);
      //logger.info('PROFILES RELOAD', allProfiles.length, allProfiles);
      _.each(allProfiles, (item) => {
        profilesCache[options.helperName][item.id] = item;
      });
    });
  },

  getUserProfile(options, userId, cb) {
    var token = process.env[channelName + '_CHANNEL_ACCESS_TOKEN'];

    var headers = {
      'content-type': 'application/json',
      'authorization': 'Bearer ' + token
    };

    request.get(LINE_SERVICE_PROFILE + '/' + userId, {headers: headers, json: true}, (err, res, body) => {
      if (err) {
        logger.error('error getting profile', err, body);
        return cb(err);
      }
      logger.info('successful getProfile:', res.statusCode, LINE_SERVICE_PROFILE + '/' + userId, body);
      cb(null, body);
    });

  }
};

if (process.argv[2] === 'load') {
  var fs = require('fs'),
    path = require('path'),
    byline = require('byline');

  var userFile = path.resolve(process.argv[3]);
  var helperName = path.resolve(process.argv[4]);
  var stream = byline(fs.createReadStream(userFile, { encoding: 'utf8' }));

  stream.on('data', function(line) {

    logger.info('userId', line);
    var item = {
      id: line
    };
    if(line[0] === 'U') {
      item.type = 'user';
    } else if (line[0] === 'C') {
      item.type = 'group';
    } else if (line[0] === 'R') {
      item.type = 'group';
    }
    profiles.saveProfile({helperName: helperName}, item, (err, result) => {
      logger.info ('saveProfile', err, result);
    });
    stream.pause();
    setTimeout(function () {
     stream.resume();
    }, 200);
  });
}
