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

const { Data, PathError } = require('./Ether')
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
const openFile = (filePath) => task(
  (resolver) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) throw (err)
      else resolver.resolve(data)
    })
  }
)

const cloneTldr = cloneRepo('https://github.com/tldr-pages/tldr.git')

const cloneDevCheet = cloneRepo('https://github.com/rstacruz/cheatsheets.git')

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

const checkDevFile = (dataPath, cheet) => {
  const cheetPath = path.join(dataPath, 'devcheet', `${cheet}.md`)

  return (fs.existsSync(cheetPath)) ? cheetPath : false
}

const checkTldrFile = (dataPath, cmd) => {
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

function checkEnvGetPath (localPath) {
  // TODO find a real way to check for git
  if (!fs.existsSync('/usr/bin/git')) {
    return PathError.of('pleas install git')
  } else if (!fs.existsSync(localPath)) {
    return PathError.of(`pleas make ${localPath} or` +
                        'set XDG_DATA_HOME to a valid directory')
  } else {
    return Data.of(path.join(localPath, 'seek'))
  }
}

/** the starting function
 * get the cmd file
 * and send to the printer */
async function main (args) {
  const localPath = process.env.XDG_DATA_HOME

  const maybeData = checkEnvGetPath(localPath)

  let seekPath
  if (!maybeData.isData()) {
    // print the error
    print('error', maybeData)
    return
  } else {
    seekPath = maybeData.__value
  }

  if (!fs.existsSync(seekPath)) {
    print('cloning repos')
    const tlPath = path.join(seekPath, 'tldr')
    const devPath = path.join(seekPath, 'devcheet')

    const tlOk = await cloneTldr(tlPath)

    const devOk = await cloneDevCheet(devPath)
    if (!tlOk || !devOk) return
  }

  const tldrPath = checkTldrFile(seekPath, args.QUERY)
  const devPath = checkDevFile(seekPath, args.QUERY)

  if (!tldrPath && !devPath) {
    print(`sorry, cant find ${colors.red}${args.QUERY} ${colors.reset}`)
    return
  }

  const pages = [tldrPath, devPath].filter(x => x)

  const runOpenFile = f => openFile(f).run().promise()

  Promise.all(R.map(runOpenFile, pages)).then(vals => {
    R.map(parseAndPrintFile, vals)
  })
}

const usage = `
Usage:
  seek QUERY
`

const args = docopt(usage)
main(args)
