const jwt = require('jsonwebtoken');
const oracledb = require('oracledb');

// Protect routes middleware
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route, missing token' });
    }

    let connection;
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT id, name, email, role FROM Users WHERE id = :id`,
            [decoded.id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Append user to request object (using lowercase keys because Oracle can return uppercase depending on settings)
        req.user = {
            id: result.rows[0].ID,
            name: result.rows[0].NAME,
            email: result.rows[0].EMAIL,
            role: result.rows[0].ROLE
        };

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route, invalid token' });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

// Grant access to specific roles middleware
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};
