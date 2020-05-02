/**
 * 引入环境变量
 */
const dotenv = require('dotenv')
const result = dotenv.config()
if (result.error) throw result.error

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
        '<rootDir>/controllers/**/*.ts',
        '<rootDir>/routes/**/*.ts',
        "!**/node_modules/**"
    ],
    coverageReporters: ["html", "text-summary", "lcov"],
}
