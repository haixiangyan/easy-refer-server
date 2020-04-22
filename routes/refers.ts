import express from 'express'
import RefersController from '@/controllers/RefersController'

// '/refers'
const RefersRouter = express.Router()

// 获取 My Refer / Other Refer
RefersRouter.get('/', RefersController.getReferList)

// 获取一个 Refer
RefersRouter.get('/:referId', RefersController.getRefer)

// 创建 Refer
RefersRouter.post('/:jobId', RefersController.createRefer)

// 部分修改 Refer
RefersRouter.patch('/:referId', RefersController.editRefer)

// 删除 Refer
RefersRouter.delete('/:referId', RefersController.deleteRefer)

export default RefersRouter
