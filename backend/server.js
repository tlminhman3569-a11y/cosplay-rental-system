const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./config/prisma');
const productRoutes = require('./routes/public/productRoutes');
const paymentRoutes = require('./routes/public/paymentRoutes');
const cartRoutes = require('./routes/customer/cartRoutes');
const orderRoutes = require('./routes/customer/orderRoutes');

dotenv.config();

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

app.use('/api', productRoutes);
app.use('/api', paymentRoutes);
app.use('/api/customer', cartRoutes);
app.use('/api/customer', orderRoutes);

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
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Máy chủ gặp lỗi khi xử lý yêu cầu.' } });
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});
