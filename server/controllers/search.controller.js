const searchService = require("../services/search.service");
const { HTTP_STATUS } = require("../constants");

const advancedSearch = async (req, res) => {
  // req.query is fully validated and coerced by Zod validator
  const result = await searchService.executeSearch(req.query);

  res.status(HTTP_STATUS.OK).json({
    listings: result.listings,
    pagination: result.pagination,
    filters: req.query,
  });
};

module.exports = { advancedSearch };
