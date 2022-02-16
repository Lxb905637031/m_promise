const PEBDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

// 基本promise
class myPromise1 {
    constructor(executor) {
        this.status = PEBDING
        this.value = undefined
        this.reason = undefined

        const resolve = (value) => {
            if (this.status === PEBDING) {
                this.status = FULFILLED
                this.value = value
            }
        }

        const reject = (reason) => {
            if (this.status === PEBDING) {
                this.status = REJECTED
                this.reason = reason
            }
        }

        try {
            executor(resolve, reject)
        } catch (error) {
            reject(error)
        }

    }

    then(onFullfilled, onRejected) {
        if (this.status === FULFILLED) {
            onFullfilled(this.value)
        }

        if (this.status === REJECTED) {
            onRejected(this.reason)
        }
    }
}

module.exports = myPromise1