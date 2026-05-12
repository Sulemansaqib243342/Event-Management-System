const oracledb = require('oracledb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    let connection;
    try {
        const { name, email, password, role, phone } = req.body;
        connection = await oracledb.getConnection();

        // Check if user already exists
        const checkResult = await connection.execute(
            `SELECT id FROM Users WHERE email = :email`,
            [email]
        );

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userRole = role || 'user';
        const result = await connection.execute(
            `INSERT INTO Users (name, email, password, role, phone) VALUES (:name, :email, :password, :role, :phone) RETURNING id INTO :id`,
            {
                name,
                email,
                password: hashedPassword,
                role: userRole,
                phone: phone || null,
                id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
        );

        const userId = result.outBinds.id[0];

        // Create token
        const token = generateToken(userId);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: userId,
                name,
                email,
                role: userRole,
                phone: phone || null
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;

        // Validate email & password input
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        connection = await oracledb.getConnection();

        // Check for user
        const result = await connection.execute(
            `SELECT id, name, email, password, role, phone FROM Users WHERE email = :email`,
            [email],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.PASSWORD);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = generateToken(user.ID);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.ID,
                name: user.NAME,
                email: user.EMAIL,
                role: user.ROLE,
                phone: user.PHONE || null
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

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT id, name, email, role, phone, created_at FROM Users WHERE id = :id`,
            [req.user.id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: result.rows[0].ID,
                name: result.rows[0].NAME,
                email: result.rows[0].EMAIL,
                role: result.rows[0].ROLE,
                phone: result.rows[0].PHONE || null,
                createdAt: result.rows[0].CREATED_AT
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
