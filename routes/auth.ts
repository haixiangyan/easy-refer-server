import express from 'express'
import AuthController from '@/controllers/AuthController'

// '/auth'
const AuthRouter = express.Router()

// 登录
AuthRouter.post('/login', AuthController.login)

// 注册
AuthRouter.post('/register', AuthController.register)

export default AuthRouter
