
const execFile = require('child_process').execFile,
  fs = require('fs'),
  path = require('path');

const tmp = require('tmp');

const imageImportPath = path.resolve(__dirname, '..', 'bin', 'makeLineImages.sh');

const s3SitePrefix = 'https://s.hobbitmaster.us/line/';

module.exports = {

  saveToDisk: function (image, fileName, cb) {
    var fileName;
    var tmp = require('tmp');
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    console.log('image', image, 'fileName', fileName);
    const tmpConfig = {
      discardDescriptor: true,
      mode: 0644,
      prefix: 'imageUpload-' + baseName + '-',
      postfix: ext
    };

    tmp.file(tmpConfig, function _tempFileCreated(err, path) {
      if (err) {
        console.log('error opening temp file', err);
        return cb(err);
      }

      console.log('File: ', path);

      // choose temp file name
      fs.writeFile(path, image, {encoding: 'binary'}, (err, written, string) => {
        console.log('err', err, 'written', written);
        cb(null, path);
      });

    });
  },

  uploadToS3: function (fileName, cb) {
    fileName = fileName.replace(' ', '');
    execFile(imageImportPath, [fileName], {}, (err, stdout, stderr) => {
      if (err) {
        console.error('err', err);
        console.error('stderr', stderr);
      }
      console.log('stdout', stdout);

      // calculate the uploaded file Names
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      console.log('baseName', baseName, 'ext', ext);
      const fullName = s3SitePrefix +baseName + 'Full.jpg';
      const previewName = s3SitePrefix + baseName + 'Preview.jpg';
      cb(err, {originalContentUrl: fullName, previewImageUrl: previewName});
    });
  }
};
