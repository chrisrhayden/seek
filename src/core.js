/** make a thing to show markdown on the cli
 * whith color
 *
 * The program will:
 * open file
 * parse and print file
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')
const R = require('ramda')
const { docopt } = require('docopt')
const { task } = require('folktale/concurrency/task')

const {
  colors,
  print,
  printCol
} = require('./printUtils')

/**
const trace = R.curry((tag, x) => {
  console.log(tag, x)
  return x
})
*/

const gitClone = (gitUrl, baseDir) => task(
  (resolver) => {
    exec(`git clone ${gitUrl} ${baseDir}`, (error, stdout, stderr) => {
      if (error) resolver.resolve(error)
      else resolver.resolve(true)
    })
  }
)

function checkEnv (localData) {
  // TODO find a real way to check for git
  const gitBin = '/usr/bin/git'
  if (!fs.existsSync(gitBin)) {
    print('pleas install git')
    return false
  }

  if (!fs.existsSync(localData)) {
    print(`pleas make ${localData} or` +
          'set XDG_DATA_HOME to a valide directory')
    return false
  }

  const seekData = path.join(localData, 'seek')

  if (!fs.existsSync(seekData)) {
    const gitUrl = 'https://github.com/tldr-pages/tldr.git'

    return gitClone(gitUrl, seekData).run().promise() ? seekData : false
  }
  return seekData
}

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
      return [line + '\n', 'magenta']
    case '>': // over all description
      return [line + '\n', 'green']
    case '-': // description
      return [normalLine(line), 'default']
    case '`': // code
      return [dropFirstLast(line) + '\n', 'default', 'bold']
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

const osDispatch = () => {
  switch (os.platform()) {
    case 'linux':
      return 'linux'
    case 'darwin' || 'openbsd' || 'freebsd': // sorry bsd
      return 'osx'
    case 'sunos':
      return 'sunos'
    case '':
      return 'windows'
  }
}

const commonOrOs = (dataPath, osName, cmd) => {
  const commonPath = path.join(dataPath, 'pages', 'common', `${cmd}.md`)
  const osPath = path.join(dataPath, 'pages', osName, `${cmd}.md`)

  if (fs.existsSync(commonPath)) {
    return commonPath
  } else if (fs.existsSync(osPath)) {
    return osPath
  } else {
    return false
  }
}

function getCommandFile (dataPath, cmd) {
  const osName = osDispatch()

  const cmdPath = commonOrOs(dataPath, osName, cmd)

  return cmdPath
}

/** the starting function
 * get the cmd file
 * and send to the printer */
async function main (args) {
  const localData = process.env.XDG_DATA_HOME
  const envData = await checkEnv(localData)
  if (!envData) {
    print(colors.red, 'somethings wrong, idk what tho', colors.reset)
    return
  }

  const cmdPath = getCommandFile(envData, args.COMMAND)

  if (!cmdPath) {
    print(`sorry, cant find ${colors.red}${args.COMMAND} ${colors.reset}`)
    return
  }

  const fileText = await openFile(cmdPath).run().promise()

  parseAndPrintFile(fileText)
}

const usage = `
Usage:
  core.js COMMAND
`

const args = docopt(usage)
main(args)
