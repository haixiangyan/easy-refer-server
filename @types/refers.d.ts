import ReferModel from '@/models/ReferModel'

type TRole = 'referer' | 'referee'
type TViewRole = 'my' | 'other'
type TStatus = 'processing' | 'referred' | 'rejected'
type TExperience = 3 | 5 | 7

type TGetRefer = TResponse<ReferModel>

type TGetReferList = TResponse<{
  referList: ReferModel[]
  total: number
}>

