"use strict";

var status = {
  'stickers': true,
  'text': true,
  'functions': true,
  'listen': true
};

module.exports = {
  isEnabled: (flag) => {
    console.log('isEnabled', flag, status[flag]);
    return (flag && status[flag]) ? status[flag] : false;
  },

  setFlag: (flag, value) => {
    console.log('setStatus', flag, value);
    if (flag && typeof value !== 'undefined') {
      status[flag] = value;
    }
  }

}
