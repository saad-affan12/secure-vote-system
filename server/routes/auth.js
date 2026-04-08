import express from 'express'
import { register, adminLogin, voterLogin } from '../controllers/authController.js'

const router = express.Router()

router.post('/register', register)
router.post('/admin-login', adminLogin)
router.post('/voter-login', voterLogin)

export default router
