/**
 * Constants Index File
 * Central export point for all application constants
 */

const errorCodes = require("./errorCodes");

module.exports = {
  ...errorCodes,

  // You can add more constant files here as your project grows
  // For example:
  // ...statusCodes,
  // ...apiRoutes,
  // ...configValues,
};
