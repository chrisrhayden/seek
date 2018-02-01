const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const R = require('ramda')
const { task } = require('folktale/concurrency/task')

const {
  print,
  colors
} = require('./printUtils')

const dropTwo = R.slice(2, Infinity)

const makeDir = (path) => task(
  (resolver) => {
    fs.mkdir(path, (err) => resolver.resolve(err))
  }
)

const makeFile = (txt, cmdPath) => task(
  (resolver) => {
    fs.writeFile(txt, cmdPath, (err) => resolver.resolve(err))
  }
)

async function makeTemplet (cmd) {
  const codeText = `
  - description
  \`code\`
  `

  const userConf = process.env.XDG_CONFIG_HOME

  const userPath = path.join(userConf, 'seek')

  if (fs.existsSync(userConf) && !fs.existsSync(userPath)) {
    const dirErr = await makeDir(userPath).run().promise()
    if (dirErr) return print('dirErr 1', dirErr)

    const userPage = path.join(userConf, 'seek', 'pages')

    const dirErr2 = await makeDir(userPage).run().promise()
    if (dirErr2) return print('dirErr 2', dirErr2)
  } else if (!fs.existsSync(userConf)) {
    print('please use xdg')
  }

  const cmdPath = path.join(userPath, `${cmd}.md`)

  const fileErr = await makeFile(codeText, cmdPath).run().promise()
  if (fileErr) return print('file err', fileErr)
}

const openEditor = (cmdPath) => task(
  (resolver) => {
    const editor = process.env.EDITOR

    exec(`${editor} ${cmdPath}`, (error, stdout, stderr) => {
      if (error) resolver.resolve([error, stderr])
      else resolver.resolve(stdout)
    })
  }
)

async function testMakePage () {
  const [cmd, filePath] = dropTwo(process.argv)

  const cmdPath = makeTemplet(cmd, filePath)

  const maybeError = await openEditor(cmdPath).run().promise()
  if (maybeError) print('editor error', maybeError)
}

testMakePage()
