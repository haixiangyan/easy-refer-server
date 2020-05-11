import JobModel from '@/models/JobModel'

type TFullJob = JobModel & {
  logs: TLog[]
}

type TGetFullJobList = TResponse<{
  jobList: TFullJob[],
  total: number
}>

type TGetFullJob = TResponse<TFullJob>

type TGetJob = TResponse<JobModel>

type TLog = {
  date: string
  count: number
}
