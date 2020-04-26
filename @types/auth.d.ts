import UserModel from '@/models/UserModel'

type TLogin = TResponse<{
  accessToken: string
  refreshToken: string
  expireAt: Date
}>

type TLoginForm = {
  email: string
  password: string
}

type TRegister = TRegister<UserModel>

type TRegistrationForm = {
  email: string
  password: string
}
