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
    const user = await UserModel.findOne({
      where: {email}
    })

    if (!user) return cb(null, false, {message: '用户不存在'})

    if (user.password !== password) return cb(null, false, {message: '密码不正确'})

    cb(null, user, {message: '登录成功'})
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
