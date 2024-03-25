"use strict";
require('dotenv-safe').load({allowEmptyValues: true, silent: true});

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const request = require('request');
const loggers = require('namespaced-console-logger')();

const logger = loggers.get('service/content');


var content = module.exports = {
  getImage: function (event, channelName) {

    var token = process.env[channelName + '_CHANNEL_ACCESS_TOKEN'];
    var headers = {
      'authorization': 'Bearer ' + token
    };

    const LINE_SERVICE_CONTENT = process.env.LINE_DATA_SERVICE + `/message/${event.id}/content`;

    logger.info('getContent', event.id);
    request.get(LINE_SERVICE_CONTENT, {headers: headers, encoding: 'binary'}, (err, res, body) => {
      if (err) {
        logger.error('error sending reply', err, body);
        return;
      }
      //logger.info('successful reply to', res.statusCode, res.headers, LINE_SERVICE_CONTENT);
      let writeFile = path.resolve('/var/linebot', 'LINEFILE-' + event.id + '-' + res.headers['content-type'].replace('/', '.', 'g'));

      fs.writeFile(writeFile, body, 'binary', (err) => {
        if (err) {
          logger.error('error writing file', writeFile, err);
        }
        fs.chown(writeFile, 500, 500, (err) => {

        });
      });

    });
  }
};


