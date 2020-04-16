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
        '<rootDir>/routes/**/*.ts',
        "!**/node_modules/**"
    ],
    coverageReporters: ["html", "text-summary", "lcov"],
}
