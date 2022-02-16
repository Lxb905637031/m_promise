const PEBDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

// 处理异步与多次调用
class myPromise2 {
    constructor(executor) {
        this.status = PEBDING
        this.value = undefined
        this.reason = undefined

        this.onFulfilledCallbacks = []
        this.onRejectedCallbacks = []

        const resolve = (value) => {
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
        if (this.status === FULFILLED) {
            onFulfilled(this.value)
        }

        if (this.status === REJECTED) {
            onRejected(this.reason)
        }

        if (this.status === PEBDING) {
            // 订阅
            this.onFulfilledCallbacks.push(() => {
                this.onFulfilled(this.value)
            })
            this.onRejectedCallbacks.push(() => {
                this.onRejected(this.reason)
            })
        }
    }
}

module.exports = myPromise2