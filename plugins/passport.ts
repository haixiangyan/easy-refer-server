import passport from 'passport'
import {Strategy as LocalStrategy} from 'passport-local'
import {Strategy as JWTStrategy, ExtractJwt} from 'passport-jwt'
import UserModel from '../models/UserModel'
import {parseEnv} from '@/utils/config'

parseEnv()

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, cb) => {
    const dbUser = await UserModel.findOne({
      where: {email}
    })

    if (!dbUser) return cb(null, false, {message: '用户不存在'})

    if (dbUser.password !== password) return cb(null, false, {message: '密码不正确'})

    cb(null, dbUser.toJSON(), {message: '登录成功'})
  }
))

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  },
  async (jwtPayload, cb) => {
    try {
      const user = {userId: jwtPayload.userId}

      cb(null, user)
    } catch (err) {
      cb(err)
    }
  }
))

export default passport
