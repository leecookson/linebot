"use strict";

const responseData = require('../data/response'),
  loggers = require('namespaced-console-logger')(),
  importImage = require('../service/image_import');

const logger = loggers.get('resources/response');

function getAllResponses (req, res) {
  logger.info('getAllResponses', req.params.botName);
  responseData.find({helperName: req.params.botName, query: {}, sort: {name: 1}, limit: req.params.limit}, (err, data) => {
    if (err) {
      res.status(500);
      res.json(err);
      return;
    }

    res.status(200);
    res.json(data);
    return;

  });
}

function get (req, res) {
  logger.info('get', req.params.botname, req.params.id);
  responseData.find({helperName: req.params.botName, query: {id: req.params.id}, limit: 1}, (err, data) => {
    if (err) {
      res.status(500);
      res.json(err);
      return;
    }

    res.status(200);
    res.json(data || {});
    return;

  });
}

function createNewResponse (req, res) {
  logger.info('createNewResponse', req.params.botname, req.body);
}

function updateResponse (req, res) {
  let rule = req.body;

  logger.info('updateResponse req.body', req.params.botname, req.body);

  //TODO:  validate
  delete rule._id;
  rule.id = req.params.id;

  responseData.saveItem({helperName: req.params.botName}, rule, (err, data) => {
    if (err) {
      res.status(500);
      res.json(err);
      return;
    }
    res.status(200);
    res.json(data || {});
    return;
  });
}

function deleteResponse (req, res) {
  responseData.delete({helperName: req.params.botName, id: req.params.id}, (err, data) => {
    if (err) {
      res.status(500);
      res.json(err);
      return;
    }
    logger.info('deleteResponse', req.params.botName);
    res.status(200);
    res.json(data || {});
    return;
  });
}

function uploadImage (req, res) {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }
  req.params.index = parseInt(req.params.index, 10);
  req.params.id = parseInt(req.params.id, 10);

  const imageData = req.files.file_data.data;
  const imageName = req.files.file_data.name.replace(' ', '');
  logger.info('upload', imageName, req.files, imageName);
  importImage.saveToDisk(imageData, imageName, (err, localFileName) => {
    if (err) {
      res.status(500);
      return res.json(err);
    }

    importImage.uploadToS3(localFileName, (err, imageUrls) => {
      if (err) {
        res.status(500);
        return res.json(err);
      }

      logger.info('sent to s3', localFileName, imageUrls);

      responseData.find({helperName: req.params.botName, query: {id: req.params.id}, limit: 1}, (err, data) => {
        if (err) {
          res.status(500);
          return res.json(err);
        }
        data = data[0];
        console.log('fetch response for', req.params.id, data);
        imageUrls.type = 'image';
        data.response[req.params.index] = imageUrls;
        responseData.saveItem({helperName: req.params.botName}, data, (err) => {
          if (err) {
            res.status(500);
            return res.json(err);
          }

          res.status(200);
          res.json({
            localFileName: localFileName
          });
        });
      });
    });
  });
}

function uploadPushImage (req, res) {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }

  logger.info('upload', req.files);
  const imageData = req.files.file_data.data;
  const imageName = req.files.file_data.name.replace(' ', '');
  logger.info('upload', req.files, imageName);
  importImage.saveToDisk(imageData, imageName, (err, localFileName) => {
    if (err) {
      res.status(500);
      return res.json(err);
    }

    importImage.uploadToS3(localFileName, (err, imageUrls) => {
      if (err) {
        res.status(500);
        return res.json(err);
      }

      logger.info('sent to s3', localFileName, imageUrls);


      res.status(200);
      res.json({
        localFileName: localFileName,
        imageUrls: imageUrls
      });
    });
  });
}


function response (app) {
  // Newsletters API
  app.put('/api/response/:botName/:id', updateResponse);
  app.get('/api/response/:botName/:id', get);
  app.delete('/api/response/:botName/:id', deleteResponse);

  app.get('/api/response/:botName', getAllResponses);
  app.post('/api/response/:botName', createNewResponse);

  app.post('/api/response/:botName/:id/:index/image', uploadImage);
  app.post('/api/response/:botName/push/image', uploadPushImage);

}

module.exports = response;
