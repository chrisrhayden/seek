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

const { docopt } = require('docopt')
const { task } = require('folktale/concurrency/task')

const { parseAndPrintFile } = require('./printer')
const {
  cloneRepo,
  colors,
  print
} = require('./utils')

function osDispatch () {
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

function makeEnv () {
  const theOS = osDispatch()

  if (theOS === 'linux') {
    const homeSeek = path.join(process.env.HOME, '.seek')

    if (fs.existsSync(homeSeek)) {
      return homeSeek
    }

    const localPath = process.env.XDG_DATA_HOME
    const seek = path.join(localPath, 'seek')

    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath)
    }

    if (!fs.existsSync(seek)) {
      fs.mkdirSync(seek)
    }

    return seek
  } else {
    const localPath = process.env.HOME
    fs.mkdirSync(localPath)
    return localPath
  }
}

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

function checkTldrFile (dataPath, cmd) {
  const makeTldrPage = pgDir => path.join(
    dataPath, 'tldr', 'pages', pgDir, `${cmd}.md`)

  const osPath = makeTldrPage(osDispatch())

  const commonPath = makeTldrPage('common')

  if (fs.existsSync(commonPath)) return commonPath
  else if (fs.existsSync(osPath)) return osPath
  else return false
}

const cloneTldr = cloneRepo('https://github.com/tldr-pages/tldr.git')

/** the starting function
 * get the cmd file
 * and send to the printer */
async function main (args) {
  const seekPath = makeEnv()

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

main(docopt(usage))
