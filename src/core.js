/** make a thing to show markdown on the cli
 * whith color
 *
 * The program will:
 * open file
 * parse and print file
 */

const fs = require('fs')
const R = require('ramda')
const { docopt } = require('docopt')
const { task } = require('folktale/concurrency/task')

const {
  colors,
  format,
  printNNL
} = require('./printUtils')

const doc = `
Usage:
  core.js FILEPATH
`

/**
const trace = R.curry((tag, x) => {
  console.log(tag, x)
  return x
})
*/

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
      return colors.yellow + line
    case '>': // over all description
      return colors.green + line + '\n'
    case '-': // description
      return colors.default + normalLine(line)
    case '`': // code
      return format.bold + dropFirstLast(line) + '\n'
  }
}

/** map through file, sending to right print */
const parseAndPrintFile = (fileText) => {
  const fileData = R.split('\n', fileText)

  const rst = colors.reset

  fileData.forEach(line => {
    const pLine = printDispatch(line)

    printNNL(pLine ? `${pLine} ${rst} \n` : rst)
  })
}

/** fs.fileRead() using folktale task()
 *
 * the resolver.resolve() call /? method
 * will return the output of the fs.readFile() like magik */
const openFile = (filePath) => task(
  (resolver) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) throw (err)
      else resolver.resolve(data)
    })
  }
)

/** the starting function
 *
 * TODO
 * check the env for files
 * if none get the repo
 * else show if exists
 *
 * get the text and send to the printer */
async function main (args) {
  const fileText = await openFile(args.FILEPATH).run().promise()

  parseAndPrintFile(fileText)
}

/* docopt will have a fit if args aren't correct
 * so no need to check them explicitly */
const args = docopt(doc)
main(args)
