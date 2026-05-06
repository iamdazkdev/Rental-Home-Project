/**
 * Standardized API Features for Pagination, Sorting, and Filtering
 */

const getPaginatedResults = async (req, Model, query = {}, populateFields = []) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-createdAt';

  let queryBuilder = Model.find(query).skip(skip).limit(limit).sort(sort);
  
  if (populateFields && populateFields.length > 0) {
    populateFields.forEach(field => { 
      queryBuilder = queryBuilder.populate(field); 
    });
  }

  const [data, total] = await Promise.all([
    queryBuilder.lean(),
    Model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const buildQuery = (queryParams) => {
  const query = {};

  if (queryParams.status) query.status = queryParams.status;
  if (queryParams.type) query.type = queryParams.type;
  if (queryParams.minPrice || queryParams.maxPrice) {
    query.price = {};
    if (queryParams.minPrice) query.price.$gte = Number(queryParams.minPrice);
    if (queryParams.maxPrice) query.price.$lte = Number(queryParams.maxPrice);
  }
  if (queryParams.search) {
    query.$or = [
      { title: { $regex: queryParams.search, $options: 'i' } },
      { description: { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  return query;
};

module.exports = {
  getPaginatedResults,
  buildQuery
};
