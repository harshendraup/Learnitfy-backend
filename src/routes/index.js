const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin');
const userRoutes = require('./user')

const defaultRoutes = [
  {
    path: '/api/admin',
    route: adminRoutes,
  },
  {
    path:'/api/user',
    route:userRoutes
  }

];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
