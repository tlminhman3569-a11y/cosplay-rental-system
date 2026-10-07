const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./config/prisma');

dotenv.config();

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Kiểm tra kết nối Prisma bằng một API đơn giản
app.get('/', async (req, res) => {
    try {
        // Thử query vào DB (nếu kết nối thành công sẽ không lỗi)
        await prisma.$connect();
        res.send('Cosplay Rental API is running & Prisma Connected to MongoDB!');
    } catch (error) {
        res.status(500).send(`Database Connection Error: ${error.message}`);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});