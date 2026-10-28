import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { errorHandler } from './middlewares/error.js'
import vendorRoutes from './routes/vendor/index.js'

const app = express()
app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))))

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Server đang chạy!' })
})

// Mount routes
app.use('/api/vendor', vendorRoutes)

// Error handler (luôn để cuối)
app.use(errorHandler)

export default app
