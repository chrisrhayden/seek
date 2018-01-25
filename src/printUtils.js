const print = console.log

const printNNL = x => {
  process.stdout.write(x)
}

const format = {
  bold: '\033[1m'
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
  white: '\033[97',
  reset: '\033[0m'
}

exports.colors = colors
exports.format = format
exports.print = print
exports.printNNL = printNNL
