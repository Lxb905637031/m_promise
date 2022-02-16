const PEBDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

// 处理异步与多次调用
// class myPromise3 {
//     constructor(executor) {
//         this.status = PEBDING
//         this.value = undefined
//         this.reason = undefined

//         this.onFulfilledCallbacks = []
//         this.onRejectedCallbacks = []

//         const resolve = (value) => {
//             if (this.status === PEBDING) {
//                 this.status = FULFILLED
//                 this.value = value

//                 // 发布
//                 this.onFulfilledCallbacks.forEach(fn => fn())
//             }
//         }

//         const reject = (reason) => {
//             if (this.status === PEBDING) {
//                 this.status = REJECTED
//                 this.reason = reason

//                 // 发布
//                 this.onRejectedCallbacks.forEach(fn => fn())
//             }
//         }

//         try {
//             executor(resolve, reject)
//         } catch (error) {
//             reject(error)
//         }

//     }

//     then(onFulfilled, onRejected) {
//         if (this.status === FULFILLED) {
//             onFulfilled(this.value)
//         }

//         if (this.status === REJECTED) {
//             onRejected(this.reason)
//         }

//         if (this.status === PEBDING) {
//             // 订阅
//             this.onFulfilledCallbacks.push(() => {
//                 this.onFulfilled(this.value)
//             })
//             this.onRejectedCallbacks.push(() => {
//                 this.onRejected(this.reason)
//             })
//         }
//     }
// }

function resolvePromise(promise, x, resolve, reject) {
    if (promise === x) {
        return reject(new TypeError('Chaining cycle detected for promise #<myPromise3>'))
    }

    let called = false

    // x 的值可以为promise 普通值 object
    if ((typeof x === 'object' && x !== 'null') || typeof x === 'function') {
        try {
            let then = x.then
            if (typeof then === 'function') {
                // promise
                then.call(x, (y) => {
                    if (called) return
                    called = true
                    // 继续返回promise 递归处理
                    resolvePromise(promise, y, resolve, reject)
                }, (r) => {
                    if (called) return
                    called = true
                    reject(r)
                })
            } else {
                resolve(x)
            }
        } catch (error) {
            reject(error)
        }
    } else {
        resolve(x)
    }

}

// 链式调用
class myPromise3 {
    constructor(executor) {
        this.status = PEBDING
        this.value = undefined
        this.reason = undefined

        this.onFulfilledCallbacks = []
        this.onRejectedCallbacks = []

        const resolve = (value) => {
            // resolve参数为promise
            if (value instanceof myPromise3) {
                value.then(resolve, reject)
                return
            }

            if (this.status === PEBDING) {
                this.status = FULFILLED
                this.value = value

                // 发布
                this.onFulfilledCallbacks.forEach(fn => fn())
            }
        }

        const reject = (reason) => {
            if (this.status === PEBDING) {
                this.status = REJECTED
                this.reason = reason

                // 发布
                this.onRejectedCallbacks.forEach(fn => fn())
            }
        }

        try {
            executor(resolve, reject)
        } catch (error) {
            reject(error)
        }

    }

    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value
        onRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason }

        var promise2 = new myPromise3((resolve, reject) => {
            if (this.status === FULFILLED) {
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.value)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                }, 0)
            }

            if (this.status === REJECTED) {
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                }, 0)
            }

            if (this.status === PEBDING) {
                // 订阅
                this.onFulfilledCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = this.onFulfilled(this.value)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (error) {
                            reject(error)
                        }                        
                    }, 0)
                })
                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = this.onRejected(this.reason)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (error) {
                            reject(error)
                        }
                    })
                })
            }
        })

        return promise2
    }

    catch(errorCallback) {
        this.then(null, errorCallback)
    }

    finally(finallyCallback) {
        return this.then((value) => {
            return myPromise3.resolve(finallyCallback()).then(() => value)
        }, (reason) => {
            return myPromise3.resolve(finallyCallback()).then(() => { throw reason })
        })
    }

    static resolve(value) {
        return new myPromise3((resolve, reject) => {
            resolve(value)
        })
    }

    static all(promiseArr) {
        let res = []
        let idx = 0

        return new myPromise3((resolve, reject) => {
            promiseArr.map((promise, index) => {
                // 是否为promise
                if (isPromise(promise)) {
                    promise.then(res => {
                        formatResArr(res, index, resolve)
                    }, reject)
                } else {
                    formatResArr(promise, index, resolve)
                }
            })
        })

        function formatResArr(value, index, resolve) {
            res[index] = value

            if (idx++ === promiseArr.length) {
                resolve(res)
            }
        }

        function isPromise(x) {
            if ((typeof x === 'object' && x !== 'null') || typeof x === 'function') {
                let then = x.then

                if (typeof then === 'function') {
                    return true
                }

            } else {
                return false
            }
        }
    }

    static allSettled(promiseArr) {
        let res = []
        let idx = 0

        if (isIterable(promiseArr)) {
            throw new TypeError(promiseArr + ' is not iterable (cannot read property Symbol(Symbol.iterator))')
        }

        return new myPromise3((resolve, reject) => {
            if (promiseArr.length === 0) {
                resolve([])
            }

            promiseArr.map((promise, index) => {
                if (isPromise(promise)) {
                    promise.then((value) => {
                        formatResArr('fulfilled', value, index, resolve)
                    }, (reason) => {
                        formatResArr('rejected', reason, index, reject)
                    })
                } else {
                    formatResArr('fulfilled', promise, index, resolve)
                }
            })
        })

        function formatResArr(status, value, index, resolve) {
            switch(status) {
                case 'fulfilled': 
                    res[index] = {
                        status,
                        value
                    }
                    break
                case 'rejected': 
                    res[index] = {
                        status,
                        reason: value
                    }
                    break
                default:
                    break
            }

            if (++idx === promiseArr.length) {
                return
            }
        }

        function isIterable(value) {
            return value !== null && value !== undefined && typeof value[Symbol.iterator] === 'function'
        }

        function isPromise(x) {
            if ((typeof x === 'object' && x !== 'null') || typeof x === 'function') {
                let then = x.then

                if (typeof then === 'function') {
                    return true
                }

            } else {
                return false
            }
        }
    }

    static race(promiseArr) {
        return new myPromise3((resolve, reject) => {
            promiseArr.map((promise) => {
                if (isPromise(promise)) {
                    promise.then(resolve, reject)
                } else {
                    resolve(promise)
                }
            })
        })
        
        function isPromise(x) {
            if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
                let then = x.then
                if (typeof then === 'function') {
                    return true
                }
            } else {
                return false
            }
        }
    }
}


module.exports = myPromise3