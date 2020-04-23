import UserModel from '@/models/UserModel'

type TLogin = TResponse<{
  token: string
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
