const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}


function errorHandler(err, req, res, next) {
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

 
  if (err && err.code) {
    switch (err.code) {
      case 'P2002': {
       
        const field = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'value';
        return res.status(409).json({
          message: `A record with that ${field} already exists`,
        });
      }
      case 'P2025':
        return res.status(404).json({ message: 'The requested record was not found' });
      case 'P2003':
        return res.status(409).json({
          message: 'This record is referenced by other data and cannot be changed',
        });
      default:
        break;
    }
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({ message: 'Something went wrong on the server' });
}

module.exports = { notFoundHandler, errorHandler };
