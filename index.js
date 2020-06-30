class m_promise {
  constructor(executor) {
    this.status = 'pending'
    this.value = undefined
    this.reason = undefined
    this.onResolveCallbacks = []
    this.onRejectedCallbacks = []
    let resolve = (value) => {
      if (status === 'pending') {
        this.status = 'fulfilled'
        this.value = value
        this.onResolveCallbacks.forEach(fn => fn())
      }
    }
    let reject = (reason) => {
      if (status === 'pending') {
        this.status = 'rejected'
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    try {
      executor(resolve, reject)
    } catch(err) {
      reject(err)
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : error => { throw err }
    let promise2 = new m_promise((resolve, reject) => {
      // 状态为fulfilled,传入成功的值
      if (this.status === 'fulfilled') {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value)
            resolvePromise(promise2, x, onFulfilled, onRejected)
          } catch(e) {
            reject(e)
          }
        },0)
      }
      // 状态为rejected,传入失败的值
      if (this.status === 'rejected') {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(promise2, x, onFulfilled, onRejected)
          } catch(e) {
            reject(e)
          }
        },0)
      }
      // 状态为pending
      if (this.status === 'pending') {
        this.onResolveCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value)
              resolvePromise(promise2, x, onFulfilled, onRejected)
            } catch(e) {
              reject(e)
            }
          },0)
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              resolvePromise(promise2, x, onFulfilled, onRejected)
            } catch(e) {
              reject(e)
            }
          },0)
        })
      }
    })
    // 完成链式
    return promise2
  }
}

function resolvePromise(promise2, x, onFulfilled, onRejected) {
  // 循环引用报错
  if (promise2 === x) {
    return reject(new TypeError('chaining cycle detected for promise'))
  }
  // 防止多次调用
  let called
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      // A+规定，声明then = x的then方法
      let then = x.then
      // 如果then是函数,默认是promise
      if (typeof then === 'function') {
        // then执行第一个参数是this,后面是成功的回调和失败的回调
        then.call(x, y => {
          if (called) return
          called = true
          // resolve结果依旧是promise那就继续解析
          resolvePromise(promise2, y, resolve, reject)
        }, err => {
          // 成功和失败只能调用一个
          if (called) return;
          called = true;
          reject(err)
        })
      } else {
        // 成功直接调用
        resolve(x)
      }
    } catch(err) {
      if (called) return
      called = true
      reject(err)
    }
  } else {
    resolve(x)
  }
}