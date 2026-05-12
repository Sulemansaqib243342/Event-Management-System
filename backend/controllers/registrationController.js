const oracledb = require('oracledb');

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private (Logged in users)
exports.registerEvent = async (req, res) => {
    let connection;
    try {
        const { event, guests, specialRequirements, paymentMethod, name, email } = req.body;
        connection = await oracledb.getConnection();

        // Check if event exists
        const eventCheck = await connection.execute(
            `SELECT id FROM Events WHERE id = :id`,
            [event]
        );
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // FIND OR CREATE USER based on email
        let userId;
        const userCheck = await connection.execute(
            `SELECT id FROM Users WHERE email = :email`,
            [email]
        );
        
        if (userCheck.rows.length > 0) {
            userId = userCheck.rows[0][0];
        } else {
            // Create a dummy user
            const newUser = await connection.execute(
                `INSERT INTO Users (name, email, password) VALUES (:name, :email, :password) RETURNING id INTO :id`,
                {
                    name: name || 'Guest User',
                    email: email,
                    password: 'dummy_password', // Mock password for fast checkout
                    id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
                },
                { autoCommit: true }
            );
            userId = newUser.outBinds.id[0];
        }

        // Check for duplicate registration
        const existingCheck = await connection.execute(
            `SELECT id FROM Registrations WHERE user_id = :userId AND event_id = :eventId`,
            [userId, event]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'You are already registered for this event' });
        }

        // Create registration
        const result = await connection.execute(
            `INSERT INTO Registrations (user_id, event_id, guests, special_requirements, payment_method, phone)
             VALUES (:userId, :eventId, :guests, :reqs, :payment, :phone) RETURNING id INTO :id`,
            {
                userId: userId,
                eventId: event,
                guests: guests || 1,
                reqs: specialRequirements || '',
                payment: paymentMethod || 'cc',
                phone: req.body.phone || null,
                id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
        );

        res.status(201).json({
            success: true,
            data: { _id: result.outBinds.id[0], event, guests }
        });
    } catch (err) {
        // Oracle unique constraint violation code is usually ORA-00001
        if (err.message && err.message.includes('ORA-00001')) {
            return res.status(400).json({ success: false, message: 'You are already registered for this event' });
        }
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

// @desc    Get logged in user's registrations
// @route   GET /api/registrations/my-registrations
// @access  Private
exports.getMyRegistrations = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT r.id as reg_id, r.guests, r.status, r.payment_method, r.registered_at,
                    e.id as event_id, e.title, e.event_date, e.venue
             FROM Registrations r
             JOIN Events e ON r.event_id = e.id
             WHERE r.user_id = :userId`,
            [req.user.id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const registrations = result.rows.map(r => ({
            _id: r.REG_ID,
            guests: r.GUESTS,
            status: r.STATUS,
            paymentMethod: r.PAYMENT_METHOD,
            registeredAt: r.REGISTERED_AT,
            event: {
                _id: r.EVENT_ID,
                title: r.TITLE,
                date: r.EVENT_DATE,
                venue: r.VENUE
            }
        }));

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

// @desc    Get all registrations
// @route   GET /api/registrations/all-registrations
// @access  Private (Admin only)
exports.getAllRegistrations = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT r.id as reg_id, r.guests, r.status, r.payment_method, r.registered_at,
                    u.id as user_id, u.name as user_name, u.email as user_email,
                    e.id as event_id, e.title as event_title, e.event_date as event_date
             FROM Registrations r
             JOIN Users u ON r.user_id = u.id
             JOIN Events e ON r.event_id = e.id`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const registrations = result.rows.map(r => ({
            _id: r.REG_ID,
            guests: r.GUESTS,
            status: r.STATUS,
            paymentMethod: r.PAYMENT_METHOD,
            registeredAt: r.REGISTERED_AT,
            user: {
                _id: r.USER_ID,
                name: r.USER_NAME,
                email: r.USER_EMAIL
            },
            event: {
                _id: r.EVENT_ID,
                title: r.EVENT_TITLE,
                date: r.EVENT_DATE
            }
        }));

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

// @desc    Delete registration
// @route   DELETE /api/registrations/:id
// @access  Private (Admin only)
exports.deleteRegistration = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM Registrations WHERE id = :id`,
            [req.params.id],
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/registrations/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        
        // Query for aggregate stats
        const result = await connection.execute(
            `SELECT 
                COUNT(*) as total_registrations,
                SUM(guests) as total_attendees,
                SUM(guests * price) as total_revenue
             FROM Registrations r
             JOIN Events e ON r.event_id = e.id`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Query for event count
        const eventCountResult = await connection.execute(
            `SELECT COUNT(*) as count FROM Events`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const stats = result.rows[0];
        
        res.status(200).json({
            success: true,
            data: {
                totalRegistrations: stats.TOTAL_REGISTRATIONS || 0,
                totalAttendees: stats.TOTAL_ATTENDEES || 0,
                totalRevenue: stats.TOTAL_REVENUE || 0,
                totalEvents: eventCountResult.rows[0].COUNT || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

// @desc    Get detailed revenue report
// @route   GET /api/registrations/revenue-report
// @access  Private (Admin only)
exports.getRevenueReport = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        
        // Revenue by event
        const result = await connection.execute(
            `SELECT 
                e.id, 
                e.title, 
                e.category,
                COUNT(r.id) as registrations_count,
                SUM(r.guests) as total_guests,
                SUM(r.guests * e.price) as revenue
             FROM Events e
             LEFT JOIN Registrations r ON e.id = r.event_id
             GROUP BY e.id, e.title, e.category
             ORDER BY revenue DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.status(200).json({
            success: true,
            data: result.rows.map(row => ({
                eventId: row.ID,
                title: row.TITLE,
                category: row.CATEGORY,
                registrationsCount: row.REGISTRATIONS_COUNT || 0,
                totalGuests: row.TOTAL_GUESTS || 0,
                revenue: row.REVENUE || 0
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};
