'use strict';

module.exports = {
  ...require('./error-handler'),
  ...require('./request-logger'),
  ...require('./validate'),
  ...require('./authenticate'),
  ...require('./authorize-roles'),
};
