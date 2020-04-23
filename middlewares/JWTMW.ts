import passport from '../plugins/passport'

class JWTMW {
  public static authenticate = passport.authenticate('jwt', {
    session: false
  })
}

export default JWTMW
