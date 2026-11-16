const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Origins allowed to call this API (the Vite dev server by default).
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools like curl/Postman that send no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

// Parses JSON request bodies into req.body.
app.use(express.json());

// All application routes live under /api.
app.use('/api', apiRoutes);

// Unknown route -> 404, then the central error handler.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
