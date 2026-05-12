const oracledb = require('oracledb');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        
        let sql = `SELECT * FROM Events`;
        let binds = {};
        
        // Simple search by title
        if (req.query.search) {
            sql += ` WHERE LOWER(title) LIKE '%' || LOWER(:search) || '%'`;
            binds.search = req.query.search;
        }
        
        sql += ` ORDER BY created_at DESC`;
        
        // Execute query
        const result = await connection.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const events = result.rows;

        res.status(200).json({
            success: true,
            count: events.length,
            data: events.map(e => ({
                _id: e.ID,
                title: e.TITLE,
                description: e.DESCRIPTION,
                date: e.EVENT_DATE,
                time: e.EVENT_TIME,
                venue: e.VENUE,
                category: e.CATEGORY,
                price: e.PRICE,
                imageUrl: e.IMAGE_URL,
                createdAt: e.CREATED_AT
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

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM Events WHERE id = :id`,
            [req.params.id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        const e = result.rows[0];

        res.status(200).json({ 
            success: true, 
            data: {
                _id: e.ID,
                title: e.TITLE,
                description: e.DESCRIPTION,
                date: e.EVENT_DATE,
                time: e.EVENT_TIME,
                venue: e.VENUE,
                category: e.CATEGORY,
                price: e.PRICE,
                imageUrl: e.IMAGE_URL,
                createdAt: e.CREATED_AT
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

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin only)
exports.createEvent = async (req, res) => {
    let connection;
    try {
        const { title, description, date, time, venue, category, price, imageUrl } = req.body;
        connection = await oracledb.getConnection();
        
        const result = await connection.execute(
            `INSERT INTO Events (title, description, event_date, event_time, venue, category, price, image_url) 
             VALUES (:title, :description, TO_DATE(:event_date, 'YYYY-MM-DD'), :event_time, :venue, :category, :price, :image_url)
             RETURNING id INTO :id`,
            {
                title,
                description,
                event_date: date.substring(0, 10), // Ensure YYYY-MM-DD
                event_time: time,
                venue,
                category,
                price: price || 0,
                image_url: imageUrl || 'images/event_corporate.png',
                id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
        );

        res.status(201).json({
            success: true,
            data: { _id: result.outBinds.id[0], title, venue, date }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin only)
exports.updateEvent = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        
        // Simple update: assuming we just want to update title for demo, or all fields
        const { title, description, date, time, venue, category, price } = req.body;
        
        const result = await connection.execute(
            `UPDATE Events SET 
             title = COALESCE(:title, title), 
             description = COALESCE(:description, description), 
             event_date = COALESCE(TO_DATE(:event_date, 'YYYY-MM-DD'), event_date), 
             event_time = COALESCE(:time, event_time), 
             venue = COALESCE(:venue, venue), 
             category = COALESCE(:category, category), 
             price = COALESCE(:price, price)
             WHERE id = :id`,
            {
                title: title || null,
                description: description || null,
                event_date: date ? date.substring(0, 10) : null,
                time: time || null,
                venue: venue || null,
                category: category || null,
                price: price !== undefined ? price : null,
                id: req.params.id
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({ success: true, message: 'Event updated' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
exports.deleteEvent = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM Events WHERE id = :id`,
            [req.params.id],
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
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
