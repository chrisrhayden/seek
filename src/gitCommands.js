const { task } = require('folktale/concurrency/task')
const { exec } = require('child_process')
const fs = require('fs')

const {
  colors,
  print
} = require('./printUtils')
/**
const path = require('path')
const os = require('os')

const { docopt } = require('docopt')

const { Data, PathError } = require('./Ether.js')
const { parseAndPrintFile } = require('./printer')

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

const cloneRepo = url => async dataPath => {
  if (!fs.existsSync(dataPath)) {
    print('no local files, cloning repo \n' +
      'url ' + colors.green + `${url} \n` +
      colors.reset + 'local path ' + colors.green + dataPath +
      colors.reset + '\n')

    // run git clone returning a promise
    const gitPut = await gitClone(url, dataPath).run().promise()
    if (gitPut) { // usually only git errors
      print(colors.yellow, gitPut, colors.reset)
      return false
    }
    return true
  }
}

exports.cloneRepo = cloneRepo
