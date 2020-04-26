import JobModel from '@/models/JobModel'

type TFullJob = JobModel & {
  referredCount: number
  processedChart: TChartItem[]
}

type TGetFullJobList = TResponse<{
  jobList: TFullJob[],
  total: number
}>

type TGetFullJob = TResponse<TFullJob>

type TGetJob = TResponse<JobModel>

type TChartItem = {
  date: string
  count: number
}
