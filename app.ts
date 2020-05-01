import createError from 'http-errors'
import express, {ErrorRequestHandler} from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'

import {parseEnv} from '@/utils/config'
// 路由
import JobsRouter from '@/routes/jobs'
import RefersRouter from '@/routes/refers'
import AuthRouter from '@/routes/auth'
import ResumesRouter from '@/routes/resumes'
import UploadRouter from '@/routes/upload'
import UsersRouter from '@/routes/users'
// 中间件
import JWTMW from '@/middlewares/JWTMW'

const app = express()

parseEnv()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'fe')))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'upload')))

app.use('/api/auth', AuthRouter)
app.use('/api/jobs', JobsRouter)

app.use('/api/refers', RefersRouter)
app.use('/api/resumes', JWTMW.authenticate, ResumesRouter)
app.use('/api/upload', JWTMW.authenticate, UploadRouter)
app.use('/api/users', JWTMW.authenticate, UsersRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(<ErrorRequestHandler>function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

export default app
