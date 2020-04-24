import UserModel from '@/models/UserModel'
import {TFullJob} from '@/@types/jobs'

type TUser = {
  info: TUserInfo
  job: TFullJob | null
}

type TUserInfo =  UserModel & {
  myReferTotal: number
  processedMyReferCount: number
  otherReferTotal: number
  processedOtherReferCount: number
}

type TGetFullUser = TResponse<TUser>
type TGetUser = TResponse<UserModel>

type TGetAvatar = TResponse<{
  avatarUrl: string
}>
