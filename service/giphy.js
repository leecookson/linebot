
const request = require('request'),
  _ = require('lodash'),
 loggers = require('namespaced-console-logger')();

const logger = loggers.get('service/response_functions');

const GIPHY_SERVICE = process.env.GIPHY_SERVICE;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

module.exports = {
  search: function (options, cb) {

    /*    q - search query term or phrase
      limit - (optional) number of results to return, maximum 100. Default 25.
      offset - (optional) results offset, defaults to 0.
      rating - (optional) limit results to those rated (y,g, pg, pg-13 or r).
      lang - (optional) specify default country for regional content; format is 2-letter ISO 639-1 country code. See list of supported languages here
      fmt - (optional) return results in html or json format (useful for viewing responses as GIFs to debug/test)
    */

    var DEFAULT_OPTIONS = {
      q: '',
      limit: 1,
      offset: 0,
      rating: 'pg-13',
      lang: 'us',
      fmt: 'json',
      api_key: GIPHY_API_KEY
    };
    var giphyOptions = _.defaults(options, DEFAULT_OPTIONS);

    var query = _.map(giphyOptions, (value, key) => {
      return key + '=' + encodeURIComponent(value);
    }).join('&');

    request.get(GIPHY_SERVICE + '?' + query, {json: true}, (err, res, body) => {
      if (err) {
        logger.error('error searching giphy', err, body);
        return cb(err);
      }
      logger.info('successful getProfile:', res.statusCode, GIPHY_SERVICE + '?' + query, body);
      cb(null, body);
    });
  }
}
