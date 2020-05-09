import {TStatus} from '@/@types/refers'

export const REFER_STATES: {[key: string]: TStatus} = {
  processing: 'processing',
  rejected: 'rejected',
  referred: 'referred'
}

export const JOB_STATES = {
  active: 'active',
  expired: 'expired'
}
