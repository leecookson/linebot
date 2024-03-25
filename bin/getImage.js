require('dotenv-safe').load({allowEmptyValues: true, silent: true});

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const request = require('request');

var getImage = module.exports = {
  getContent: function (messageId) {

    var headers = {
      'authorization': 'Bearer ' + process.env.HELPER_CHANNEL_ACCESS_TOKEN
    };

    const LINE_SERVICE_CONTENT = process.env.LINE_SERVICE + `/message/${messageId}/content`;

    console.log('getContent', messageId);
    request.get(LINE_SERVICE_CONTENT, {headers: headers, encoding: 'binary'}, (err, res, body) => {
      if (err) {
        console.error('error sending reply', err, body);
        return;
      }
      console.log('successful reply to', res.statusCode, res.headers, LINE_SERVICE_CONTENT);

      fs.writeFile(path.resolve('', 'LINEFILE-' + messageId + '-' + res.headers['content-type'].replace('/', '.', 'g')), body, 'binary', (err) => {
        if (err) {
          console.error('error writing file');
        }
      });

    });
  }
};

getImage.getContent(process.argv[2]);

