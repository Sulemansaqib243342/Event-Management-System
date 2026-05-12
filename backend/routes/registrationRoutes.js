const express = require('express');
const {
    registerEvent,
    getMyRegistrations,
    getAllRegistrations,
    deleteRegistration,
    getDashboardStats,
    getRevenueReport
} = require('../controllers/registrationController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All registration routes require the user to be logged in
router.use(protect);

router.post('/', registerEvent);
router.get('/my-registrations', getMyRegistrations);

// Admin only routes
router.get('/all-registrations', authorize('admin'), getAllRegistrations);
router.get('/stats', authorize('admin'), getDashboardStats);
router.get('/revenue-report', authorize('admin'), getRevenueReport);
router.delete('/:id', authorize('admin'), deleteRegistration);

module.exports = router;
