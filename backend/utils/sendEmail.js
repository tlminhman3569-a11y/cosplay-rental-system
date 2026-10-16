const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password từ Gmail
    },
});


const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: `"Cosplay Rental System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '[A11y Cosplay] Mã xác thực OTP đăng ký tài khoản',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Xác thực tài khoản</h2>
        <p>Mã OTP của bạn là: <b style="font-size: 24px; color: #4F46E5;">${otp}</b></p>
        <p>Mã có hiệu lực trong <b>3 phút</b>. Vui lòng không chia sẻ mã này cho ai.</p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };