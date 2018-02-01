#!/usr/bin/env node
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

const R = require('ramda')
const { docopt } = require('docopt')
const { task } = require('folktale/concurrency/task')

const { cloneRepo } = require('./gitCommands')
const { parseAndPrintFile } = require('./printer')
const {
  colors,
  print
} = require('./printUtils')

/**
const trace = R.curry((tag, x) => {
  console.log(tag, x)
  return x
})
*/

/** fs.fileRead() using folktale task()
 *
 * the resolver.resolve() call /? method
 * will return the output of the fs.readFile() like magik */
const openFile = filePath => task(
  (resolver) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) throw (err)
      else resolver.resolve(data)
    })
  }
).run().promise()

const cloneTldr = cloneRepo('https://github.com/tldr-pages/tldr.git')

const osDispatch = () => {
  switch (os.platform()) {
    case 'linux':
      return 'linux'
    case 'darwin' || 'openbsd' || 'freebsd': // sorry bsd
      return 'osx'
    case 'sunos':
      return 'sunos'
    case 'win32':
      return 'windows'
  }
}

function checkTldrFile (dataPath, cmd) {
  const makeTldrPage = pgDir => path.join(
    dataPath, 'tldr', 'pages', pgDir, `${cmd}.md`)

  const osPath = makeTldrPage(osDispatch())

  const commonPath = makeTldrPage('common')

  if (fs.existsSync(commonPath)) {
    return commonPath
  } else if (fs.existsSync(osPath)) {
    return osPath
  } else {
    return false
  }
}

function checkEnv (localPath) {
  // TODO find a real way to check for git
  if (!fs.existsSync('/usr/bin/git')) {
    print('pleas install git')
    return false
  } else if (!fs.existsSync(localPath)) {
    print('pleas use XDG_DATA_HOME')
    return false
  } else {
    return localPath
  }
}

const makeSeekPath = lPath => (lPath) ? path.join(lPath, 'seek') : false

/** the starting function
 * get the cmd file
 * and send to the printer */
async function main (args) {
  const getSeekPath = R.compose(makeSeekPath, checkEnv)

  const seekPath = getSeekPath(process.env.XDG_DATA_HOME)

  if (!fs.existsSync(seekPath)) {
    print('no local files,')
    const tlOk = await cloneTldr(path.join(seekPath, 'tldr'))
    if (!tlOk) return
  }

  const tldrPath = checkTldrFile(seekPath, args.QUERY)

  if (!tldrPath) {
    return print(`sorry, cant find ${colors.red}${args.QUERY} ${colors.reset}`)
  }

  const fileText = await openFile(tldrPath)

  parseAndPrintFile(fileText)
}

const usage = `
Usage:
  seek QUERY
`

const args = docopt(usage)
main(args)
