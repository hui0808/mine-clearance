const e = sel => document.querySelector(sel)

const es = sel => document.querySelectorAll(sel)

const log = console.log.bind(console)

const bindAll = function(sel, eventName, callback) {
    let e = es(sel)
    for (let input of e) {
        input.addEventListener(eventName, function(event) {
            callback(event)
        })
    }
}

const bindEventDelegate = function(sel, eventName, responseClass, callback) {
    let element = e(sel)
    let retFunc = event => {
        let self = event.target
        if (self.classList.contains(responseClass)) {
            callback(event)
        }
    }
    element.addEventListener(eventName, retFunc)
    return retFunc
}

const ensure = function(condition, message) {
    // 在条件不成立的时候, 输出 message
    if (!condition) {
        log('*** 测试失败', message)
    } else {
        log('*** 测试成功')
    }
}

const isArray = function(o) {
    // 判断对象是否为数组
    return Array.isArray(o)
}

const isSubset = function(a, b) {
    // 检查是否 a 中的每个元素都在 b 中出现
    for (let i = 0; i < a.length; i++) {
        if (!b.includes(a[i])) {
            return false
        }
    }
    return true
}

const includes = function(a, b) {
    // 检查是否 b 中存在 a
    for (let i = 0; i < b.length; i++) {
        if (isArray(a) && isArray(b[i])) {
            if (arrayEquals(a, b[i])) {
                return true
            }
        } else if (Object.is(a, b[i])) {
            return true
        }
    }
    return false
}

const arrayEquals = function(a, b) {
    // 递归版数组判断，可以判断任意维度的数组是否相等
    if (a.length !== b.length) {
        return false
    }
    for (let i = 0; i < a.length; i++) {
        if (isArray(a[i]) && isArray(b[i])) {
            if (!arrayEquals(a[i], b[i])) {
                return false
            }
        } else if (!Object.is(a[i], b[i])) {
            return false
        }
    }
    return true
}

const clonedArray = function(array) {
    return array.slice(0)
}

const clonedSquare = function(array) {
    let clone = []
    for (let i = 0; i < array.length; i++) {
        clone.push(clonedArray(array[i]))
    }
    return clone
}


const markAround = function(square, i, j) {
    const inner = function(array, i, j) {
        let n = array.length
        let m = array[0].length
        if (i >= 0 && i < n && j >= 0 && j < m) {
            if (array[i][j] !== 9) {
                array[i][j]++
            }
        }
    }

    let k = square[i][j]

    if (k === 9) {
        inner(square, i - 1, j - 1)
        inner(square, i, j - 1)
        inner(square, i + 1, j - 1)
        inner(square, i - 1, j)
        inner(square, i - 1, j + 1)
        inner(square, i, j + 1)
        inner(square, i + 1, j + 1)
        inner(square, i + 1, j)
    }
}

const markedSquare = function(array) {
    let square = clonedSquare(array)
    for (let i = 0; i < square.length; i++) {
        let line = square[i]
        for (let j = 0; j < line.length; j++) {
            markAround(square, i, j)
        }
    }
    return square
}

const creatMap = function(x, y, mineCount, firstClickXY=null) {
    firstClickXY = firstClickXY || [0, 0]
    let map = zeros(x, y)
    let sel = []
    for (let i = 0; i < x * y; i++) {
        let xx = Math.floor(i / y)
        let yy = i % y
        sel.push([xx, yy])
    }
    let around = aroundCoordinate(...firstClickXY, x, y)
    around.push(firstClickXY)
    sel = sel.filter(([x, y]) =>
        !includes([x, y], around)
    )
    for (let i = 0; i < mineCount; i++) {
        let index = ranint(0, sel.length)
        let [xx, yy] = sel[index]
        map[xx][yy] = 9
        sel.splice(index, 1)
    }
    return markedSquare(map)
}

const zeros = function(x, y) {
    let r = []
    for (let i = 0; i < x; i++) {
        let tmp = []
        for (let j = 0; j < y; j++) {
            tmp.push(0)
        }
        r.push(tmp)
    }
    return r
}

const range = function(start, end, step = 1) {
    let r = []
    for (let i = start; i < end; i += step) {
        r.push(i)
    }
    return r
}

function ranint(n, m) {
    // [n, m) 随机范围
    let r = Math.floor(Math.random() * (m - n) + n);
    return r;
}

const aroundCoordinate = function(x, y, h, w) {
    // 返回 (x, y) 周围的合法坐标
    let array = [
        [x - 1, y - 1],
        [x, y - 1],
        [x + 1, y - 1],
        [x - 1, y],
        [x - 1, y + 1],
        [x, y + 1],
        [x + 1, y + 1],
        [x + 1, y],
    ].filter(([x, y]) =>
        x >= 0 && x < h && y >= 0 && y < w
    )
    return array
}
