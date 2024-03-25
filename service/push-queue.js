const AWS = require('aws-sdk');

AWS.config.update({region: 'us-east-1'});

const sqs = new AWS.SQS();

const PUSH_QUEUE_URL = process.env.PUSH_QUEUE_URL;

module.exports = {
  pushQueue: pushQueue,
  getQueueMessage: getQueueMessage
};

function pushQueue (message, groupID, cb) {
  var params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: PUSH_QUEUE_URL,
    DelaySeconds: 0,
    MessageGroupId: groupID || 'DEFAULT'
  };
  sqs.sendMessage(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      return cb(err);
    } else {
      console.log(data);           // successful response
      return cb(null, data);
    }
  });
}


function getQueueMessage (groupID, cb) {
  var params = {
    QueueUrl: PUSH_QUEUE_URL,
    MessageAttributeNames: [
      'All'
    ],
    WaitTimeSeconds: 20
  };
  sqs.receiveMessage(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      return cb(err);
    } else {
      console.log(data);           // successful response
      messages = data.Messages || [];
      messages.forEach((message) => {
        removeMessage(message.ReceiptHandle, () => {});
      });
      return cb(null, data);
    }
  });
}

function removeMessage (receiptHandle, cb) {
  console.log('REMOVE MESSAGE', receiptHandle);
  var params = {
    QueueUrl: PUSH_QUEUE_URL,
    ReceiptHandle: receiptHandle
  };
  sqs.deleteMessage(params, function(err, data) {
    if (err) {
      console.error('ERROR DELETING MESSAGE', err, err.stack); // an error occurred
    }
    console.log('MESSAGE REMOVED', data);
  });
}
