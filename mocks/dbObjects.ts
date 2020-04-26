import consola from 'consola'
import dayjs from 'dayjs'
import UserModel from '@/models/UserModel'
import JobModel from '@/models/JobModel'
import ReferModel from '@/models/ReferModel'
import ResumeModel from '@/models/ResumeModel'
import {encryptPassword, generateUserId} from '@/utils/auth'
import {parseEnv} from '@/utils/config'

parseEnv()

export const users = [
  {
    userId: generateUserId('user1@mail.com'),
    password: encryptPassword('123456'),
    email: 'user1@mail.com',
    experience: 2,
    name: '张三',
    intro: '我是张三，这是一份个人介绍',
    leetCodeUrl: 'https://leetcode.com',
    thirdPersonIntro: '这是张三，很完美的第三人称介绍',
    phone: '94934567',
    avatarUrl: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    jobId: 'job-1'
  },
  {
    userId: generateUserId('user2@mail.com'),
    password: encryptPassword('123456'),
    email: 'user2@mail.com',
    experience: 2,
    name: '李四',
    intro: '我是李四，这是一份个人介绍',
    leetCodeUrl: 'https://leetcode.com',
    thirdPersonIntro: '这是李四，很完美的第三人称介绍',
    phone: '94934567',
    avatarUrl: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    jobId: null
  },
  {
    userId: generateUserId('user3@mail.com'),
    password: encryptPassword('123456'),
    email: 'user3@mail.com',
    experience: 2,
    name: '王五',
    intro: '我是王五，这是一份个人介绍',
    leetCodeUrl: 'https://leetcode.com',
    thirdPersonIntro: '这是王五，很完美的第三人称介绍',
    phone: '94934567',
    avatarUrl: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    jobId: null
  },
  {
    userId: generateUserId('user4@mail.com'),
    email: 'user4@mail.com',
    password: null
  }
]

const [user1, user2, user3] = users

export const jobs = [
  {
    jobId: 'expired-job-1',
    company: 'Expired Google',
    requiredFields: ['name', 'email', 'phone', 'experience', 'referLinks', 'resumeUrl', 'intro', 'thirdPersonIntro', 'leetCodeUrl'],
    deadline: dayjs().subtract(3, 'month'),
    autoRejectDay: 5,
    referTotal: 400,
    source: 'https://www.1point3acres.com/bbs/',
    refererId: user1.userId
  },
  {
    jobId: 'job-1',
    company: 'Google',
    requiredFields: ['name', 'email', 'phone', 'experience', 'referLinks', 'resumeUrl', 'intro', 'thirdPersonIntro', 'leetCodeUrl'],
    deadline: dayjs().add(3, 'month'),
    autoRejectDay: 5,
    referTotal: 400,
    source: 'https://www.1point3acres.com/bbs/',
    refererId: user1.userId
  },
  {
    jobId: 'job-2',
    company: 'Facebook',
    requiredFields: ['name', 'email', 'phone', 'experience', 'referLinks', 'resumeUrl', 'intro', 'thirdPersonIntro', 'leetCodeUrl'],
    deadline: dayjs().add(3, 'month'),
    autoRejectDay: 3,
    referTotal: 300,
    source: 'https://www.1point3acres.com/bbs/',
    refererId: user2.userId
  }
]

const [expiredJob1, job1, job2] = jobs

export const resumes = [
  {
    resumeId: 'resume-2',
    name: '李四的简历.pdf',
    url: 'https://user-2.pdf',
    refereeId: user2.userId,
    referId: null
  },
  {
    resumeId: 'resume-21',
    name: '李四的简历.pdf',
    url: 'https://user-2.pdf',
    refereeId: user2.userId,
    referId: null
  },
  {
    resumeId: 'resume-22',
    name: '李四的简历.pdf',
    url: 'https://user-2.pdf',
    refereeId: user2.userId,
    referId: null
  },
  {
    resumeId: 'resume-23',
    name: '李四的简历.pdf',
    url: 'https://user-2.pdf',
    refereeId: user2.userId,
    referId: null
  },
  {
    resumeId: 'resume-3',
    name: '李四的简历.pdf',
    url: 'https://user-3.pdf',
    refereeId: user3.userId,
    referId: null
  },
]

const [resume2, resume21, resume22, resume23, resume3] = resumes

export const refers = [
  {
    referId: 'refer-2',
    name: '李四',
    email: 'user2@world.com',
    phone: '94934567',
    experience: 2,
    intro: '我是张三，这是一份个人介绍',
    leetCodeUrl: 'https://leetcode.com',
    thirdPersonIntro: '这是张三，很完美的第三人称介绍',
    referLinks: 'http://google.com',
    status: 'processing',
    updatedOn: dayjs().subtract(20, 'day').subtract(10, 'minute'),
    resumeId: resume2.resumeId,
    jobId: job1.jobId,
    refererId: user1.userId,
    refereeId: user2.userId,
    expiration: dayjs().add(5, 'day')
  },
  {
    referId: 'refer-3',
    name: '王五',
    email: 'user3@world.com',
    phone: '94934567',
    experience: 5,
    intro: '我是王五，这是一份个人介绍',
    leetCodeUrl: 'https://leetcode.com',
    thirdPersonIntro: '这是王五，很完美的第三人称介绍',
    referLinks: 'http://google.com',
    status: 'referred',
    updatedOn: dayjs().subtract(20, 'day'),
    resumeId: resume3.resumeId,
    jobId: job1.jobId,
    refererId: user1.userId,
    refereeId: user3.userId,
    expiration: dayjs().add(5, 'day')
  }
]

export const initMockDB = async () => {
  await UserModel.bulkCreate(users)

  await JobModel.bulkCreate(jobs)

  const [resume2, ...restResumes] = resumes
  const memoryResume = await ResumeModel.create(resume2)
  await ResumeModel.bulkCreate(restResumes)

  await ReferModel.bulkCreate(refers)

  memoryResume.referId = 'refer-2'
  await memoryResume.save()

  consola.success('成功将假数据存入数据库')
}
