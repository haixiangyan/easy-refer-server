/**
 * 引入环境变量，存在 .env 文件则读取里面的内容
 */
const fs = require('fs')
if (fs.existsSync('.env')) {
  require('dotenv').config()
}

module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/scripts/**/*.ts',
    '<rootDir>/middlewares/**/*.ts',
    '<rootDir>/controllers/**/*.ts',
    '<rootDir>/routes/**/*.ts',
    "!**/node_modules/**"
  ],
  coverageReporters: ["html", "text-summary", "lcov"],
}
