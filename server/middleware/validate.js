/**
 * Request validation middleware factory.
 * Usage: router.post("/create", validate(schema), controller.create)
 *
 * @param {Object} schema - Object with optional body, query, params validators
 * @param {Function} [schema.body] - Validator for req.body
 * @param {Function} [schema.query] - Validator for req.query
 * @param {Function} [schema.params] - Validator for req.params
 */
const validate = (schema) => (req, res, next) => {
    const errors = [];

    for (const [location, validator] of Object.entries(schema)) {
        if (typeof validator === "function") {
            const result = validator(req[location]);
            if (result && result.error) {
                errors.push(
                    ...result.error.map((e) => `${location}.${e.field}: ${e.message}`)
                );
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    next();
};

module.exports = { validate };
