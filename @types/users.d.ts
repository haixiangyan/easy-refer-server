import UserModel from '@/models/UserModel'
import {TFullJob} from '@/@types/jobs'

type TUser = {
  info: UserModel
  job: TFullJob | null
}

type TGetFullUser = TResponse<TUser>
type TGetUser = TResponse<UserModel>
