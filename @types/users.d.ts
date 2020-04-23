import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import ResumeModel from '@/models/ResumeModel'

type TUser = {
  info: TUserInfo
  job: JobModel
  resume: ResumeModel
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
