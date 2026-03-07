/**
 * Standardized API response helpers.
 * Ensures consistent response format: { success, message, data?, error? }
 */

const success = (res, { data, message = "Success", statusCode = 200 } = {}) => {
    const response = { success: true, message };
    if (data !== undefined) response.data = data;
    return res.status(statusCode).json(response);
};

const created = (res, { data, message = "Created successfully" } = {}) => {
    return success(res, { data, message, statusCode: 201 });
};

const error = (res, { message = "Internal server error", statusCode = 500, details } = {}) => {
    const response = { success: false, message };
    if (details && process.env.NODE_ENV === "development") {
        response.error = details;
    }
    return res.status(statusCode).json(response);
};

const badRequest = (res, message = "Bad request") => {
    return error(res, { message, statusCode: 400 });
};

const unauthorized = (res, message = "Unauthorized") => {
    return error(res, { message, statusCode: 401 });
};

const forbidden = (res, message = "Forbidden") => {
    return error(res, { message, statusCode: 403 });
};

const notFound = (res, message = "Not found") => {
    return error(res, { message, statusCode: 404 });
};

module.exports = {
    success,
    created,
    error,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
};
