import passport from '../plugins/passport'
import {encryptPassword, generateJWT} from '@/utils/auth'
import {Request, Response} from 'express'
import UserModel from '@/models/UserModel'
import {v4 as uuidv4} from 'uuid'

class AuthCtrlr {
  // 登录
  public static async login(req: Request, res: Response) {
    passport.authenticate('local', {session: false}, (err, user, info) => {
      if (err || !user) {
        return res.status(401).json({message: info.message})
      }

      req.login(user, {session: false}, (err) => {
        if (err) {
          return res.status(500).json({message: '登录时发生错误'})
        }

        const token = generateJWT(user.userId)

        return res.json({user, token})
      })
    })(req, res)
  }

  public static async register(req: Request, res: Response) {
    const {email, password} = req.body

    const existedDbUser = await UserModel.findOne({
      where: {email}
    })

    if (existedDbUser) {
      return res.status(409).json({message: '该用户已存在'})
    }

    const dbUser = await UserModel.create({
      userId: uuidv4(),
      email,
      password: encryptPassword(password)
    })

    return res.status(201).json(dbUser)
  }
}

export default AuthCtrlr
