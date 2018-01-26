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
const { docopt } = require('docopt')
const { task } = require('folktale/concurrency/task')

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
  seek COMMAND
`

const args = docopt(usage)
main(args)
