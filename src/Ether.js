const fs = require('fs')
// const R = require('ramda')

class Either {
  constructor (x) {
    this.__value = x
  }
  of (x) {
    return new Error(x)
  }

  either (f, g) {
    return this.isData()
  }
}

class PathError extends Either {
  static of (x) {
    return new PathError(x)
  }
  map (x) {
    return this.__value
  }

  isData () {
    return false
  }
}

class Data extends Either {
  static of (x) {
    return new Data(x)
  }
  map (f) {
    return Data.of(f(this.__value))
  }
  isData () {
    return true
  }
  existsS () {
    return fs.existsSync(this.__value)
  }
}

exports.Data = Data
exports.PathError = PathError
