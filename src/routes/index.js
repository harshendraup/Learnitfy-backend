const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin');

const defaultRoutes = [
  {
    path: '/api/admin',
    route: adminRoutes,
  },

];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
