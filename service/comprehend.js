
const AWS = require('aws-sdk');

AWS.config.update({region: 'us-east-1'});

const comprehend = new AWS.Comprehend();

module.exports = {
  getSentiment: getSentiment
};

function getSentiment (text, cb) {
  const params = {
    LanguageCode: 'en',
    Text: text
  };

  comprehend.detectSentiment(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      cb(err);
    }
    cb(null, data);
  });
}
