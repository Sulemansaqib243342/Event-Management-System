const oracledb = require('oracledb');

const connectDB = async () => {
    try {
        // Fetch CLOBs as strings to prevent circular JSON error
        oracledb.fetchAsString = [oracledb.CLOB];
        
        // Initialize the Oracle connection pool
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log(`Oracle DB Connected`);
    } catch (err) {
        console.error(`Error connecting to Oracle DB: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
