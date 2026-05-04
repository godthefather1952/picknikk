// Tastytrade API Configuration Module

// Load environment variables
require('dotenv').config();

const TASTYTRADE_API_KEY = process.env.TASTYTRADE_API_KEY || 'placeholderAPI';
const TASTYTRADE_API_SECRET = process.env.TASTYTRADE_API_SECRET || 'placeholderAPI';

module.exports = {
    TASTYTRADE_API_KEY,
    TASTYTRADE_API_SECRET
};