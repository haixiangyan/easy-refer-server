import express from 'express'
import ResumesCtrlr from '@/controllers/ResumesCtrlr'

// '/resumes'
const ResumesRouter = express.Router()

// 获取一个 Resume
ResumesRouter.get('/:resumeId', ResumesCtrlr.getResume)

export default ResumesRouter
