"use strict";

const image_import = require('./service/image_import');

image_import.uploadToS3(process.argv[2], (err, result) => {
  if (err) {
    console.error('err', err);
  }

  process.exit(0);

});
