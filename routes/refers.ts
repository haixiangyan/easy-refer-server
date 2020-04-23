import express from 'express'
import RefersCtrlr from '@/controllers/RefersCtrlr'
import RefersMW from '@/middlewares/RefersMW'

// '/refers'
const RefersRouter = express.Router()

// 获取 My Refer / Other Refer
RefersRouter.get(
  '/',
  RefersMW.updateReferStatus,
  RefersCtrlr.getReferList
)

// 获取一个 Refer
RefersRouter.get(
  '/:referId',
  RefersMW.existRefer,
  RefersMW.updateReferStatus,
  RefersCtrlr.getRefer
)

// 修改 Refer
RefersRouter.patch(
  '/:referId',
  RefersMW.existRefer,
  RefersCtrlr.editRefer
)

// 删除 Refer
RefersRouter.delete(
  '/:referId',
  RefersMW.existRefer,
  RefersCtrlr.deleteRefer
)

export default RefersRouter
