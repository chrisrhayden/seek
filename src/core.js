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
const { exec } = require('child_process')

const R = require('ramda')
const { docopt } = require('docopt')
const { task } = require('folktale/concurrency/task')

const { Data, PathError } = require('./Ether.js')
const { parseAndPrintFile } = require('./printer')

const {
  colors,
  print
} = require('./printUtils')

/**
const map = f => x => x.map(f)

const trace = R.curry((tag, x) => {
  console.log(tag, x)
  return x
})
*/

const gitClone = (gitUrl, baseDir) => task(
  (resolver) => {
    exec(`git clone ${gitUrl} ${baseDir}`, (error, stdout, stderr) => {
      if (error) resolver.resolve(error)
      else resolver.resolve(stdout)
    })
  }
)

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
    case 'win32':
      return 'windows'
  }
}

const commonOrOs = (dataPath, cmd) => {
  const makePage = (pageDir) => {
    return path.join(dataPath, 'pages', pageDir, `${cmd}.md`)
  }

  const getOsPath = R.compose(makePage, osDispatch)

  const commonPath = makePage('common')
  const osPath = getOsPath()

  if (fs.existsSync(commonPath)) {
    return commonPath
  } else if (fs.existsSync(osPath)) {
    return osPath
  } else {
    return false
  }
}

function getCommandFile (cmd, dataPath) {
  const cmdPath = commonOrOs(dataPath, cmd)

  return cmdPath
}

function checkEnvGetPath (localPath) {
  // TODO find a real way to check for git
  const gitBin = '/usr/bin/git'
  if (!fs.existsSync(gitBin)) {
    return PathError.of('pleas install git')
  } else if (!fs.existsSync(localPath)) {
    return PathError.of(`pleas make ${localPath} or` +
                        'set XDG_DATA_HOME to a valid directory')
  } else {
    return Data.of(path.join(localPath, 'seek'))
  }
}

const runGitClone = url => path => gitClone(url, path).run().promise()

const cloneTldrRepo = runGitClone('https://github.com/tldr-pages/tldr.git')

const maybeCloneRepo = async dataPath => {
  if (!fs.existsSync(dataPath)) {
    print('no local files, cloning repo \n' +
      'url ' + colors.green + 'https://github.com/tldr-pages/tldr.git \n' +
      colors.reset + 'local path ' + colors.green + dataPath +
      colors.reset + '\n')

    const gitPut = await cloneTldrRepo(dataPath)
    if (gitPut) { // usually only git errors
      print(colors.yellow, gitPut, colors.reset)
      return false
    }
    return true
  }
}

/** the starting function
 * get the cmd file
 * and send to the printer */
async function main (args) {
  const localPath = process.env.XDG_DATA_HOME

  const maybeData = checkEnvGetPath(localPath)

  let dataPath
  if (!maybeData.isData() || !maybeData.existsS()) {
    // print the error
    print(dataPath)
    return
  } else {
    dataPath = maybeData.__value
  }

  const cloneOk = maybeCloneRepo(dataPath)

  if (!cloneOk) return

  const cmdPath = getCommandFile(args.COMMAND, dataPath)

  if (!cmdPath) {
    print(`sorry, cant find ${colors.red}${args.COMMAND} ${colors.reset}`)
    return
  }

  const fileText = await openFile(cmdPath).run().promise()

  parseAndPrintFile(fileText)
}

const usage = `
Usage:
  seek COMMAND
`

const args = docopt(usage)
main(args)
