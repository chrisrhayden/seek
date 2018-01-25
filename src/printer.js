/** The printer
 */

const R = require('ramda')
const {
  printCol
} = require('./printUtils')

const map = f => x => x.map(f)

const dropFirst = line => line.slice(1)

const dropLast = line => {
  const stop = line.length - 1
  return line.slice(0, stop)
}

const dropFirstLast = R.compose(dropFirst, dropLast)

const splitWord = R.split(' ')

const newLiOrNot = (w, i) => (i && i % 10 === 0) ? w + '\n' : w

const truncateLine = R.compose(
  R.join(' '), map(newLiOrNot), splitWord)

const shortDropFirst = R.compose(truncateLine, dropFirst)

const normalLine = line => {
  const colWd = process.stdout.columns
  return (line.length > colWd) ? shortDropFirst(line) : dropFirst(line)
}

const printDispatch = line => {
  switch (R.head(line)) {
    case '':
      return null
    case '#': // title
      return [line + '\n', 'cyan', 'bold']
    case '>': // over all description
      return [line + '\n', 'magenta']
    case '-': // description
      return [normalLine(line), 'default']
    case '`': // code
      return [dropFirstLast(line) + '\n', 'green', 'dim']
  }
}

/** map through file, sending to right print */
const parseAndPrintFile = (fileText) => {
  const fileData = R.split('\n', fileText)

  fileData.forEach(line => {
    const pLine = printDispatch(line)

    if (pLine) printCol(...pLine)
  })
}

exports.parseAndPrintFile = parseAndPrintFile
