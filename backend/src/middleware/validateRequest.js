export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace with sanitized/parsed data
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;
      next();
    } catch (error) {
      if (error.errors) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.').replace(/^(body|query|params)\./, ''),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
