#!/bin/env node

const _ = require('lodash'),
  request = require('request');

const id = process.argv[2],
  name = process.argv[3];

const newResponse = {
  id: id,
  name: name,
  response: [
    {
      type: 'text',
      text: 'testing this now'
    }
  ]
};

const putOptions = {
  url: 'http://localhost:8000/api/response/' + id,
  json: true,
  body: newResponse
};

request.put(putOptions, (err, res) => {
  if (err) {
    console.error('error putting', err);
    return;
  }

  console.log('SUCCESS', res.body);
});
