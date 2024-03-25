require('dotenv-safe').load({allowEmptyValues: true, silent: true});

const pushQueue = require('./service/push-queue');

const numMessages = parseInt(process.argv[2] || '1', 10);

console.log('numMessages', numMessages);

const QUEUE_POLL_INTERVAL = 1000;

const groupID = 'HELPER';

let numRemaining = numMessages;

let numQueued = 0,
  messageIds = {};

while (numRemaining-- > 0) {
  const message = {
    source: {
      id: 'TESTID' + numRemaining
    },
    messages: [
      {
        type: 'test',
        text: 'TEST MESSAGE ' + numRemaining
      }
    ]
  };

  pushQueue.pushQueue(message, groupID, (err, data) => {
    if (err) {
      console.log('PUSH FAILED', err);
    } else {
      console.log('PUSH QUEUED', data);
      messageIds[data.MessageId] = true;
      numQueued++;
    }
  });
}

function getMessages () {
  const poll = setInterval(() => {
    pushQueue.getQueueMessage(groupID, (err, results) => {
      if (err) {
        console.error('RECEIVE FAILED', err);
      } else {
        console.log('PUSH MESSAGE RECEIVED', results);
        if (results.Messages) {
          results.Messages.forEach((message) => {
            numQueued--;
            delete messageIds[message.MessageId];
          });
        }
      }
      console.log('QUEUE SIZE', numQueued, messageIds);
      if (numQueued === 0) process.exit(1);
    });
  },
  QUEUE_POLL_INTERVAL);
}

getMessages();
