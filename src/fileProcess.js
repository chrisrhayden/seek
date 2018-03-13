const R = require('ramda')
const {
  printColor
} = require('./utils')

const map = R.curry((f, x) => x.map(f))

const dropFirst = R.slice(1, Infinity)

const dropLast = line => R.slice(0, line.length - 1, line)

const dropFirstLast = R.compose(dropFirst, dropLast)

const addNewLines = (w, i) => (i && i % 10 === 0) ? w + '\n' : w

const truncateLine = R.compose(R.join(' '), map(addNewLines), R.split(' '))

const shortDropFirst = R.compose(truncateLine, dropFirst)

const normalLine = line => {
  const colWd = process.stdout.columns
  return (line.length > colWd) ? shortDropFirst(line) : dropFirst(line)
}

const printDispatch = line => {
  switch (R.head(line)) {
    case '#': // title
      return [line + '\n', 'cyan', 'bold']
    case '>': // over all description
      return [line + '\n', 'magenta']
    case '-': // description
      return [normalLine(line), 'default']
    case '`': // code
      return [' ' + dropFirstLast(line) + '\n', 'default', 'bold']
  }
}

// const printALine = R.curry(printColor, ...printDispatch)
const printALine = line => printColor(...printDispatch(line))

// return only if the line exists
const cleanData = R.compose(R.filter(li => li), R.split('\n'))

const parseAndPrintFile = (fileText) => {
  const fileData = cleanData(fileText)

  map(printALine, fileData)
}

exports.parseAndPrintFile = parseAndPrintFile
