import express from 'express'
import cors from 'cors'

import dotenv from 'dotenv'

import { CorsConfig } from './lib/cors.config.js'
import routes from './routes/index.js'

const app = express()
app.use(express.json())
app.use(cors())
app.use('/api', routes)

dotenv.config()

export default app
