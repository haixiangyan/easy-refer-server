import passport from '../plugins/passport'
import {encryptPassword, generateJWT, generateUserId} from '@/utils/auth'
import {TLogin, TLoginForm, TRegister, TRegistrationForm} from '@/@types/auth'
import {Request, Response} from 'express'
import UserModel from '@/models/UserModel'
import {parseEnv} from '@/utils/config'

parseEnv()

class AuthCtrlr {
  /**
   * 登录
   */
  public static async login(req: Request, res: Response<TLogin>) {
    passport.authenticate('local', {session: false}, (err, user: TJWTUser, info) => {
      if (err || !user) {
        return res.status(401).json({message: info.message})
      }

      req.login(user, {session: false}, (err) => {
        if (err) {
          return res.status(500).json({message: '登录时发生错误'})
        }

        const token = generateJWT(user.userId)

        return res.json({token})
      })
    })(req, res)
  }

  /**
   * 获取新的 token
   */
  public static async refresh(req: Request, res: Response<TLogin>) {
    const user = req.user as TJWTUser

    const token = generateJWT(user.userId)

    return res.json({token})
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

    const token = generateJWT(userId)

    return res.status(201).json({token})
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
