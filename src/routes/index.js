const express = require('express');
const router = express.Router();

// Import route modules
const adminRoutes = require('./admin');

// Define route groups
const defaultRoutes = [
  {
    path: '/api/admin',
    route: adminRoutes,
  },
  // Future route groups can be added here, e.g.,
  // { path: '/api/user', route: userRoutes },
];

// Register all routes
defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
