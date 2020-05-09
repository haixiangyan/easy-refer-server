import express from 'express'
import RefersCtrlr from '@/controllers/RefersCtrlr'
import RefersMW from '@/middlewares/RefersMW'
import JWTMW from '@/middlewares/JWTMW'

// '/refers'
const RefersRouter = express.Router()

// 获取 My Refer / Other Refer
RefersRouter.get(
  '/',
  JWTMW.authenticate,
  RefersMW.updateReferStatus,
  RefersCtrlr.getReferList
)

// 获取一个 Refer
RefersRouter.get(
  '/:referId',
  JWTMW.authenticate,
  RefersMW.existRefer,
  RefersMW.updateReferStatus,
  RefersCtrlr.getRefer
)

// 创建 Refer
RefersRouter.post('/:jobId', RefersCtrlr.createRefer)

// 修改 Refer
RefersRouter.patch(
  '/:referId',
  JWTMW.authenticate,
  RefersMW.existRefer,
  RefersCtrlr.editRefer
)

// 修改 Refer 状态
RefersRouter.patch(
  '/status/:referId',
  JWTMW.authenticate,
  RefersMW.existRefer,
  RefersCtrlr.updateReferStatus
)

// 删除 Refer
RefersRouter.delete(
  '/:referId',
  JWTMW.authenticate,
  RefersMW.existRefer,
  RefersCtrlr.deleteRefer
)

export default RefersRouter
