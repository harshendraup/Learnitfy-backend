const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin');
const userRoutes = require('./user');
const faqRoute =require('./faq'); 

const defaultRoutes = [
  {
    path: '/api/admin',
    route: adminRoutes,
  },
  {
    path: '/api/user',
    route: userRoutes,
  },
  {
    path:'/api/faq',
    route:faqRoute
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
