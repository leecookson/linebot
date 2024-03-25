"use strict";

const async = require('async'),
  _ = require('lodash'),
  mongo = require('mongoskin');

const defaultOptions = {
  logLevel: 3,
  mongoDatabase: process.env.MONGO_DATABASE || 'hobbithelper',
  mongoHost: process.env.MONGO_HOST || 'localhost',
  mongoPort: process.env.MONGO_PORT || 27017,
  mongoUser: process.env.MONGO_USER || null,
  mongoPassword: process.env.MONGO_PASSWORD || null,
  collectionName: 'user'
};


const helperConfig = {
  HELPER: {
    mongoDatabase: 'hobbithelper'
  },
  CAMELOT: {
    mongoDatabase: 'camelotcaretaker'
  }
};

var dbs = {};


function getDB (options) {
  const helperName = options.helperName;
  if (!helperName) {
    console.error('cannot find helperName', options);
    return;
  }

  if (dbs[helperName]) {
    return dbs[helperName];
  }

  options = _.defaults(helperConfig[helperName], options, defaultOptions);

  let mongoURL = 'mongodb://';
  if (options.mongoUser) {

    if (defaultOptions.logLevel > 2) {
      console.log('mongo connecting as', options.mongoUser, options.helperName);
    }

    mongoURL = mongoURL + options.mongoUser + ':' + options.mongoPassword + '@' + options.mongoHost + ':' + options.mongoPort + '/' + options.mongoDatabase;
  } else {
    mongoURL = mongoURL + options.mongoHost + ':' + options.mongoPort + '/' + options.mongoDatabase;
  }

  if (defaultOptions.logLevel > 1) console.log('connecting to', mongoURL);

  dbs[helperName] = mongo.db(mongoURL, {
    w: 1,
    autoReconnect: true,
    native_parser: 1
  });


  return dbs[helperName];
}

module.exports = {
  find: (options, cb) => {
    const db = getDB(options);

    options = _.defaults(options, {
      query: {},
      limit: 99999,
      sort: {'id': -1},
      projection: {}
    });
    var collection = db.collection(defaultOptions.collectionName);

    collection.ensureIndex({'id': 1}, {unique: true}, () => {});

    collection.find(options.query, options.projection).limit(options.limit).sort(options.sort).toArray((err, data) => {
      if (!data) return cb();

      if (defaultOptions.logLevel) console.log('    loaded', data ? data.length : -1);
      cb(err, data);
    });
  },

  saveItem: (options, item, cb) => {
    const db = getDB(options);

    if (!item) {
      return cb(new Error('item not provided'));
    }

    item.id = item.id;
    item._lastUpdated = new Date();

    if (defaultOptions.logLevel > 1) console.log('item', item);
    if (defaultOptions.logLevel > 0) console.log('saving', item.id);

    let setClause = {
      $set: item
    };

    if (defaultOptions.logLevel > 0) console.log('setClause', setClause);

    db.collection(defaultOptions.collectionName).update({
      'id': item.id
    },
    setClause,
    {
      upsert: true
    }, (err, docs) => {
      if (err) {
        console.error('error savItem', err, item);
        return cb(err);
      }

      if (defaultOptions.logLevel > 0) console.log('id', item.id, 'saved', docs ? docs.results : docs);
      cb(null, docs[0]);
    });
  },

  delete: (options, cb) => {
    const db = getDB(options);

    if (defaultOptions.logLevel > 0) console.log('deleting', options.id);

    db.collection(defaultOptions.collectionName).remove({
      'id': options.id
    }, true, (err, result) => {
      if (err) {
        console.error('error delete', err, result);
        return cb(err);
      }

      if (defaultOptions.logLevel > 0) console.log('id', item.id, 'deleted', result ? result.results : result);

      cb(null, result);
    });

  }
};
