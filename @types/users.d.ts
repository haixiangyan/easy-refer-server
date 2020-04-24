import UserModel from '@/models/UserModel'
import ResumeModel from '@/models/ResumeModel'
import {TFullJob} from '@/@types/jobs'

type TUser = {
  info: TUserInfo
  job: TFullJob | null
  resume: ResumeModel | null
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