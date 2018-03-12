/* eslint-disable no-useless-escape  */
const { task } = require('folktale/concurrency/task')
const { exec } = require('child_process')
const fs = require('fs')

const print = console.log

const printNNL = x => {
  process.stdout.write(x)
}

const format = {
  bold: '1',
  dim: '2',
  underlined: '4',
  inverted: '7',
  hidden: '8',
}

const colors = {
  default: '\033[39m',
  black: '\033[30m',
  red: '\033[31m',
  green: '\033[32m',
  yellow: '\033[33m',
  blue: '\033[34m',
  magenta: '\033[35m',
  cyan: '\033[36m',
  lightgray: '\033[37m',
  darkgray: '\033[90m',
  lightred: '\033[91m',
  lightgreen: '\033[92m',
  lightyellow: '\033[93m',
  lightblue: '\033[94m',
  lightmagenta: '\033[95m',
  lightcyan: '\033[96m',
  white: '\033[97m',
  reset: '\033[0m'
}

const colNum = {
  default: '39',
  black: '30',
  red: '31',
  green: '32',
  yellow: '33',
  blue: '34',
  magenta: '35',
  cyan: '36',
  lightgray: '37',
  darkgray: '90',
  lightred: '91',
  lightgreen: '92',
  lightyellow: '93',
  lightblue: '94',
  lightmagenta: '95',
  lightcyan: '96',
  white: '97',
  reset: '0',
  rstNli: ' \033[0m \n'
}

const makeColor = (colorStr = null, formatStr = null) => {
  const ifColor = (colNum[colorStr]) ? colNum[colorStr] : '0'

  const ifFormat = (format[formatStr]) ? format[formatStr] + ';' : ''

  const pColor = '\033[' + ifFormat + ifColor + 'm'

  return pColor
}

const printCol = (pText, colorStr = null, formatStr = null) => {
  const outText = makeColor(colorStr, formatStr) + pText + colNum.rstNli

  process.stdout.write(outText)
}

const gitClone = (gitUrl, baseDir) => task(
  (resolver) => {
    exec(`git clone ${gitUrl} ${baseDir}`, (error, stdout, stderr) => {
      if (error) resolver.resolve(error)
      else resolver.resolve(stdout)
    })
  }
)

const cloneRepo = url => async dataPath => {
  if (!fs.existsSync(dataPath)) {
    print('cloning repo \n' +
      'url ' + colors.green + `${url} \n` +
      colors.reset + 'local path ' + colors.green + dataPath +
      colors.reset + '\n')

    // run git clone returning a promise
    const gitPut = await gitClone(url, dataPath).run().promise()
    if (gitPut) { // usually only git errors
      print(colors.yellow, gitPut, colors.reset)
      return false
    }
    return true
  }
}

exports.colors = colors
exports.format = format
exports.print = print
exports.printCol = printCol
exports.printNNL = printNNL
exports.cloneRepo = cloneRepo
