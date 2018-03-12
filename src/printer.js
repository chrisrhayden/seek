/** The printer
 */

const R = require('ramda')
const {
  printCol
} = require('./utils')

const map = f => x => x.map(f)

const dropFirst = R.slice(1, Infinity)

const dropLast = line => R.slice(0, line.length - 1, line)

const dropFirstLast = R.compose(dropFirst, dropLast)

const addNewLines = (w, i) => (i && i % 10 === 0) ? w + '\n' : w

const truncateLine = R.compose(
  R.join(' '), map(addNewLines), R.split(' '))

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
      return [dropFirstLast(line) + '\n', 'default', 'bold']
  }
}

const cleanData = R.compose(R.filter(li => li), R.split('\n'))

/** map through file, sending to right print */
const parseAndPrintFile = (fileText) => {
  const fileData = cleanData(fileText)

  fileData.forEach(line => {
    const [nLine, color, style] = printDispatch(line)

    printCol(nLine, color, style)
  })
}

exports.parseAndPrintFile = parseAndPrintFile
