require('dotenv-safe').load({allowEmptyValues: true, silent: true});

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const request = require('request');

var getImage = module.exports = {
  pushFile: function (fileURL) {

    var headers = {
      'authorization': 'Bearer ' + process.env.HELPER_CHANNEL_ACCESS_TOKEN
    };

    const LINE_SERVICE_PUSH = process.env.LINE_SERVICE + '/message/push';

    var postBody = {
      to: 'U03077b2163a5ea80a46b0f158a2ae9a6',
      messages: [
        {
          type: 'file',
          fileURL: fileURL,
        }
      ]
    }

    console.log('pushFile', fileURL, headers);
    request.post(LINE_SERVICE_PUSH, {headers: headers, json: postBody}, (err, res, body) => {
      if (err) {
        console.error('error sending reply', err, body);
        return;
      }
      console.log('successful reply to', res.statusCode, res.headers, LINE_SERVICE_PUSH, body);


    });
  }
};

getImage.pushFile(process.argv[2]);

