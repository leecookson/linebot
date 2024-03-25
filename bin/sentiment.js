#!/bin/env node

"use strict";

const fs = require('fs');

const sentiment = require('sentiment');

var file = process.argv[2];

console.log('file', file);


const text = fs.readFileSync(file).toString();

var r1 = sentiment(text);

console.log('score', r1.score);
console.log('comparative', r1.comparative);
console.log('word count', r1.words.length);
console.log('keys', Object.keys(r1));
