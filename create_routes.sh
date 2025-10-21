#!/bin/bash

# Create route files
for route in auth user game league ticket wallet admin live; do
  cat > src/routes/${route}.routes.js << ROUTE
const express = require('express');
const router = express.Router();
const ${route}Controller = require('../controllers/${route}.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes will be defined here
// Example:
// router.post('/example', protect, ${route}Controller.exampleMethod);

module.exports = router;
ROUTE
done

# Create controller files
for controller in auth user game league ticket wallet admin live; do
  cat > src/controllers/${controller}.controller.js << CTRL
// ${controller^} Controller

// Placeholder controller methods
// Example:
// exports.exampleMethod = async (req, res, next) => {
//   try {
//     res.status(200).json({
//       success: true,
//       message: 'Method not implemented yet',
//     });
//   } catch (error) {
//     next(error);
//   }
// };

module.exports = {};
CTRL
done

echo "Routes and controllers created!"
