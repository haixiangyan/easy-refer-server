#!/usr/bin/env node

/**
 * 引入环境变量
 */
const dotenv = require('dotenv')
const result = dotenv.config()
if (result.error) throw result.error

/**
 * Module dependencies.
 */
import app from '@/app'
import consola from 'consola'
import http from 'http'
import {HttpError} from 'http-errors'
// 数据库
import db from '@/models/db'
import {initMockDB} from '@/mocks/dbObjects'
import {createUploadDir} from '@/utils/upload'

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '4000')
app.set('port', port)

/**
 * Create HTTP server.
 */

const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: HttpError) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

async function onListening() {
  // 准备数据库
  try {
    const dev = process.env.NODE_ENV === 'development'

    await db.sync({force: dev})
    dev && await initMockDB()
  } catch (error) {
    consola.error(error)
  }

  // 准备 /uploads
  createUploadDir()

  const addr = server.address()
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr!.port
  consola.info('监听端口：' + bind)
}
