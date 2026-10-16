const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../../utils/sendEmail');
const prisma = require('../../config/prisma');


// 1. Đăng ký -> Lưu vào PendingUser & Gửi OTP
exports.register = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        // Kiểm tra email trong bảng User chính
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được đăng ký tài khoản.' });
        }

        // Hash mật khẩu & Tạo OTP 6 số
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 phút

        // Upsert vào PendingUser
        await prisma.pendingUser.upsert({
            where: { email },
            update: { password: hashedPassword, fullName, otp, expiresAt },
            create: { email, password: hashedPassword, fullName, otp, expiresAt },
        });

        // Gửi OTP qua mail
        await sendOTPEmail(email, otp);

        res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn.' });
    } catch (error) {
        console.error('Lỗi khi Đăng ký (Register Error):', error);
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

// 2. Xác thực OTP -> Chuyển sang User chính
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const pendingRecord = await prisma.pendingUser.findUnique({ where: { email } });

        if (!pendingRecord) {
            return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc email chưa được đăng ký.' });
        }

        if (pendingRecord.otp !== otp) {
            return res.status(400).json({ message: 'Mã OTP không chính xác.' });
        }

        if (new Date() > pendingRecord.expiresAt) {
            await prisma.pendingUser.delete({ where: { email } });
            return res.status(400).json({ message: 'Mã OTP đã quá hạn. Vui lòng đăng ký lại.' });
        }

        // Lấy vai trò mặc định CUSTOMER
        const defaultRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
        if (!defaultRole) {
            return res.status(500).json({ message: 'Không tìm thấy vai trò mặc định trong hệ thống.' });
        }

        // Tạo user chính thức
        const newUser = await prisma.user.create({
            data: {
                email: pendingRecord.email,
                passwordHash: pendingRecord.password,
                fullName: pendingRecord.fullName,
                roleId: defaultRole.id,
                emailVerified: true,
            },
        });

        // Xóa bản ghi tạm
        await prisma.pendingUser.delete({ where: { email } });

        // Tạo JWT Token
        const token = jwt.sign(
            { id: newUser.id, roleId: newUser.roleId },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Đăng ký tài khoản thành công!',
            token,
            user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, roleId: newUser.roleId },
        });
    } catch (error) {
        console.error('Lỗi khi Verify OTP:', error);
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

// 3. Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
        }

        const token = jwt.sign(
            { id: user.id, roleId: user.roleId },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token,
            user: { id: user.id, email: user.email, fullName: user.fullName, roleId: user.roleId },
        });
    } catch (error) {
        console.error('Lỗi khi Đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { idToken, googleId, email, fullName, avatarUrl } = req.body;

        let gId = googleId;
        let gEmail = email;
        let gName = fullName;
        let gAvatar = avatarUrl;

        // Nếu gửi idToken từ Google SDK -> Gọi lên Google Server để lấy thông tin thật 100%
        if (idToken) {
            const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
            if (!googleRes.ok) {
                return res.status(400).json({ message: 'Mã xác thực Google không hợp lệ hoặc đã hết hạn.' });
            }
            const payload = await googleRes.json();
            gId = payload.sub;
            gEmail = payload.email;
            gName = payload.name;
            gAvatar = payload.picture;
        }

        if (!gEmail || !gId) {
            return res.status(400).json({ message: 'Thông tin Google không hợp lệ.' });
        }

        // Tìm user đã tồn tại theo googleId hoặc email
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: gId },
                    { email: gEmail }
                ]
            }
        });

        const defaultRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
        if (!defaultRole) {
            return res.status(500).json({ message: 'Không tìm thấy vai trò mặc định trong hệ thống.' });
        }

        if (user) {
            // Nếu đã tồn tại tài khoản bằng email thường thì liên kết thêm googleId
            if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: gId, avatarUrl: user.avatarUrl || gAvatar }
                });
            }
        } else {
            // Tạo tài khoản mới trực tiếp từ Google
            user = await prisma.user.create({
                data: {
                    email: gEmail,
                    fullName: gName || 'Khách hàng Google',
                    googleId: gId,
                    avatarUrl: gAvatar,
                    roleId: defaultRole.id,
                    emailVerified: true,
                }
            });
        }

        // Cấp JWT Token của hệ thống
        const token = jwt.sign(
            { id: user.id, roleId: user.roleId },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Đăng nhập bằng Google thành công!',
            token,
            user: { id: user.id, email: user.email, fullName: user.fullName, roleId: user.roleId, avatarUrl: user.avatarUrl },
        });
    } catch (error) {
        console.error('Lỗi khi Google Login:', error);
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};