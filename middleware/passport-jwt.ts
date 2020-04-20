import passport from '../plugins/passport'

export default passport.authenticate('jwt', {
  session: false
})
