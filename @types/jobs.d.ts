import JobModel from '@/models/JobModel'

type TJobItem = JobModel & {
  referredCount: number
  processedChart: TChartItem[]
}

type TGetJobItemList = TResponse<{
  jobItemList: TJobItem[],
  total: number
}>

type TGetJobItem = TResponse<TJobItem>

type TGetJob = TResponse<TJob>

type TChartItem = {
  date: string
  count: number
}
