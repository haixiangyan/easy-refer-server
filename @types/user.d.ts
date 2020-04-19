type TUser = {
  userId: string
  email: string
  name: string
  experience: number
  intro: string
  phone: string
  leetCodeUrl: string
  thirdPersonIntro: string
  avatarUrl: string
  finishedRefers: number,
  totalRefers: number,
  finishedResumes: number,
  totalResumes: number
}

type TUserForm = TMapper & {
  email: string
  name: string
  experience: number
  intro: string
  phone: string
  leetCodeUrl: string
  thirdPersonIntro: string
  avatarUrl: string
}
