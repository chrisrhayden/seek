const { task } = require('folktale/concurrency/task')
const { exec } = require('child_process')
const fs = require('fs')

const {
  colors,
  print
} = require('./printUtils')

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
    print('cloning repo \n' +
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
