import createError from 'http-errors'
import express, {ErrorRequestHandler} from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import bodyParser from 'body-parser'

// 路由
import JobsRouter from './routes/jobs'
import RefersRouter from './routes/refers'
import AuthRouter from './routes/auth'
import ResumesRouter from './routes/resumes'
import UploadRouter from './routes/upload'
import UsersRouter from './routes/users'

// 数据库
// import db from './models/db'
// import {initMockDB} from './mocks/dbObjects'

const jsonParser = bodyParser.json()

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/auth', jsonParser, AuthRouter)
app.use('/api/jobs', JobsRouter)
app.use('/api/refers', RefersRouter)
app.use('/api/resumes', ResumesRouter)
app.use('/api/upload', UploadRouter)
app.use('/api/users', UsersRouter)

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
