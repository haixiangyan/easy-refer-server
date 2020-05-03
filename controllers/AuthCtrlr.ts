import passport from '../plugins/passport'
import {v4 as uuidv4} from 'uuid'
import {encryptPassword, generateJWT, generateUserId} from '@/utils/auth'
import {TLogin, TLoginForm, TRegister, TRegistrationForm} from '@/@types/auth'
import {Request, Response} from 'express'
import UserModel from '@/models/UserModel'
import TokenModel from '@/models/TokenModel'
import dayjs from 'dayjs'

class AuthCtrlr {
  /**
   * 登录
   */
  public static async login(req: Request, res: Response<TLogin>) {
    passport.authenticate('local', {session: false}, (err, dbUser: UserModel, info) => {
      if (err || !dbUser) {
        return res.status(401).json({message: info.message})
      }

      req.login(dbUser, {session: false}, async (err) => {
        if (err) {
          return res.status(500).json({message: '登录时发生错误'})
        }

        // 去掉原来的 refreshToken
        const preRefreshToken = dbUser.refreshToken
        await dbUser.update({refreshToken: null})
        await TokenModel.destroy({where: {refreshToken: preRefreshToken}})

        // 新的 token 信息
        const accessToken = generateJWT(dbUser.userId)
        const refreshToken = uuidv4()
        const expireAt = dayjs().add(1, 'month').toDate()

        // 存入 refresh token
        await TokenModel.create({refreshToken, expireAt, userId: dbUser.userId})
        // 更新 user
        await UserModel.update({refreshToken}, {where: {userId: dbUser.userId}})

        return res.json({accessToken, refreshToken, expireAt})
      })
    })(req, res)
  }

  /**
   * 获取新的 token
   */
  public static async refresh(req: Request, res: Response<TLogin>) {
    // 判断是否存在
    const dbToken = await TokenModel.findByPk(req.body.refreshToken)
    if (!dbToken) {
      return res.status(401).json({message: 'Refresh Token 不存在'})
    }

    // 判断是否过期
    if (dayjs(dbToken.expireAt).isBefore(dayjs())) {
      return res.status(401).json({message: 'Refresh Token 已过期'})
    }

    const accessToken = generateJWT(dbToken.userId)
    const refreshToken = uuidv4()
    const expireAt = dayjs().add(1, 'month').toDate()

    // 更新 token 信息
    await UserModel.update({refreshToken}, {where: {userId: dbToken.userId}})
    await TokenModel.create({refreshToken, expireAt})
    await dbToken.destroy()

    return res.json({accessToken, refreshToken, expireAt})
  }

  /**
   * 激活账号
   */
  public static async activate(req: Request, res: Response) {
    const {email, password} = req.body as TLoginForm

    const userId = generateUserId(email)
    const dbUser = await UserModel.findByPk(userId)

    if (!dbUser) {
      return res.status(404).json({message: '用户不存在'})
    }

    if (dbUser.password) {
      return res.status(400).json({message: '该用户已激活'})
    }

    // 更新密码
    dbUser.password = encryptPassword(password)
    await dbUser.save()

    return res.status(201).json()
  }

  /**
   * 注册用户
   */
  public static async register(req: Request, res: Response<TRegister>) {
    const {email, password} = req.body as TRegistrationForm

    const existedDbUser = await UserModel.findOne({
      where: {email}
    })

    if (existedDbUser) {
      return res.status(409).json({message: '该用户已存在或需要激活'})
    }

    const dbUser = await UserModel.create({
      userId: generateUserId(email),
      email,
      password: encryptPassword(password)
    })

    return res.status(201).json(dbUser)
  }
}

export default AuthCtrlr
