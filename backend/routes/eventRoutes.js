const express = require('express');
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.route('/')
    .get(getEvents);

router.route('/:id')
    .get(getEventById);

// Admin only routes (TEMPORARILY PUBLIC FOR TESTING FRONTEND)
router.route('/')
    .post(createEvent); // Removed: protect, authorize('admin')

router.route('/:id')
    .put(updateEvent) // Removed: protect, authorize('admin')
    .delete(deleteEvent); // Removed: protect, authorize('admin')

module.exports = router;
