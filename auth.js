const
  _ = require('lodash'),
  loggers = require('namespaced-console-logger')();

const logger = loggers.get('resources/push');

function getMiddleware(auth) {
  return function checkAuth (req, res, next) {
    const path = req.path;
    logger.info('auth', auth);

    const helper = getHelper(path);
    const tool = getTool(path);
    logger.info('path', path, helper, tool);

    const helperAccess = req.user.helpers.indexOf(helper);
    const toolAccess = req.user.tools.indexOf(tool);
    logger.info('helperAccess', req.user.helpers, helperAccess);
    logger.info('toolAccess', req.user.tools, toolAccess);


    if (helperAccess == -1 || toolAccess == -1) {
      return res.status(403).send({Error: 'Forbidden'});
    }

    next();
  };
}

function getHelper (path) {
  const pathSplit = path.split('/');
  return pathSplit[3];
}

function getTool (path) {
  const pathSplit = path.split('/');
  return pathSplit[2];
}

module.exports = {
  getMiddleware: getMiddleware
};
