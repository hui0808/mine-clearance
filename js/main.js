class GameObject {
    static new(...args) {
        let i = new this(...args)
        // i.main = this.main
        return i
    }

    init() {
    }

    update() {
    }

    debug() {
    }

    destory() {

    }
}

class Game extends GameObject {
    constructor() {
        super()
        this.fps = 30
        this.scene = null
        this.runWithScene(Scene)
        e('#id-reset').onclick = event => {
            this.replaceScene(Scene)
        }
    }

    static instance(...args) {
        this.i = this.i || new this(...args)
        return this.i
    }

    // update
    update() {
        this.scene.update()
    }

    runloop() {
        this.update()
        // debug
        // this.debug()

        // next run loop
        setTimeout(() => {
            this.runloop()
        }, 1000 / this.fps)
    }

    runWithScene(scene) {
        this.scene = Scene.new(this)
        // 开始运行程序
        setTimeout(() => {
            this.runloop()
        }, 1000 / this.fps)
    }

    replaceScene(scene, callback) {
        let s = scene.new(this)
        callback && callback(s)
        this.scene.destory()
        delete this.scene
        this.scene = s
    }
}


class Grid extends GameObject {
    constructor(game, num, x, y) {
        super()
        this.game = game
        this.num = num
        this.x = x
        this.y = y
        this.hide = true
        this.mark = false
        this.peer = false
        this.boom = false
    }

    isMine() {
        return this.num === 9
    }

    click() {
        this.hide = false
        this.mark = false
        if (this.isMine()) {
            this.boom = true
            this.game.gameOver()
            log('game over')
        } else if (this.num === 0) {
            this.game.expand(this.x, this.y)
        }
    }
}

class Scene extends GameObject {
    constructor(game) {
        super()
        this.game = game
        this.grids = []
        this.mines = null
        this.marks = null
        this.remainMines = 20
        this.x = 10
        this.y = 20
        this.firstClickXY = null

        this.register()
        this.initHtml()
    }

    createGrid(firstClickXY) {
        // 生成格子数组
        let mine = creatMap(this.x, this.y, this.remainMines, firstClickXY)
        log('mine', mine)
        for (let i = 0; i < this.x; i++) {
            for (let j = 0; j < this.y; j++) {
                this.grids.push(Grid.new(this, mine[i][j], i, j))
            }
        }
    }

    getGrid(x, y) {
        // 通过 x, y 坐标获得grid
        return this.grids[x * this.y + y]
    }

    gameOver() {
        for (let i of this.grids) {
            i.hide = false
            i.mark = false
        }
        this.update()
        this.game.replaceScene(GameOver)
    }

    initHtml() {
        let html = ''
        for (let i = 0; i < this.x; i++) {
            let rowHtml = ''
            for (let j = 0; j < this.y; j++) {
                rowHtml += `<div class="cell hide" x="${i}" y="${j}"></div>`
            }
            html += `<div class="row">${rowHtml}</div>`
        }
        let s = e('#id-game')
        s.innerHTML = html
    }

    getGridElement(x, y) {
        // 获得(x, y)对应格子的元素
        let r = e(`[x="${x}"][y="${y}"]`)
        return r
    }

    aroundCoordinate(x, y) {
        // 返回 (x, y) 周围的合法坐标
        return aroundCoordinate(x, y, this.x, this.y)
    }

    getXYFormElement(element) {
        let x = parseInt(element.getAttribute('x'))
        let y = parseInt(element.getAttribute('y'))
        return [x, y]
    }

    getGridFormElement(element) {
        // 获得元素对应的格子对象
        let [x, y] = this.getXYFormElement(element)
        return this.getGrid(x, y)
    }

    getAroundGrids(x, y) {
        // 获得(x, y)周围的合法格子对象
        let around = this.aroundCoordinate(x, y)
        return around.map(([x, y]) => {
            return this.getGrid(x, y)
        })
    }

    peerAroundGrids(grid, ispeer) {
        if (grid.hide === false) {
            let aroundGrids = this.getAroundGrids(grid.x, grid.y).filter((grid) =>
                grid.hide
            )
            let mines = aroundGrids.filter(grid => grid.isMine())
            let marks = aroundGrids.filter(grid => grid.mark)
            if (marks.length !== 0 && !isSubset(marks, mines)) {
                // 有标记，但是标记错了，gameover
                mines[0].click()
            } else if (mines.length === marks.length && !arrayEquals(mines, aroundGrids)) {
                // 全部标记正确，展开周围多余的格子
                for (let g of aroundGrids) {
                    if (!g.isMine() && !g.mark) {
                        g.click()
                    }
                }
            } else {
                for (let g of aroundGrids) {
                    g.peer = ispeer
                }
            }
        }
    }

    register() {
        this.mouseup = bindEventDelegate('#id-game', 'mouseup',
            'cell', event => {
                let target = event.target
                let grid = this.getGridFormElement(target)
                if (event.button === 2) {
                    if (grid.hide && this.remainMines > 0) {
                        log('mark', grid)
                        grid.mark = !grid.mark
                    }
                } else if (event.button === 0) {
                    this.peerAroundGrids(grid, false)
                }
            })
        this.mousedown = bindEventDelegate('#id-game', 'mousedown',
            'cell', event => {
                let target = event.target
                let grid = this.getGridFormElement(target)
                if (event.button === 0) {
                    // 左键
                    if (this.firstClickXY === null) {
                        let [x, y] = this.getXYFormElement(target)
                        this.createGrid([x, y])
                        this.firstClickXY = [x, y]
                        grid = this.getGrid(x, y)
                    }
                    if (grid.hide === true) {
                        grid.click()
                        log('click', grid)
                    } else {
                        this.peerAroundGrids(grid, true)
                        log('peer', grid)
                    }
                }
            })
    }

    expand(x, y) {
        const inner = (x, y) => {
            let grid = this.getGrid(x, y)
            if (grid.hide === false || grid.mark) {
                return
            }
            if (grid.num !== 9) {
                grid.hide = false
            }
            if (grid.num === 0) {
                this.expand(x, y)
            }
        }
        let arr = this.aroundCoordinate(x, y)
        for (let [x, y] of arr) {
            inner(x, y)
        }
    }

    checkComplete() {
        let noHideGrids = this.grids.filter(grid => grid.hide)
        return arrayEquals(this.mines, this.marks) && arrayEquals(this.mines, noHideGrids)
    }

    updateMineMark() {
        this.mines = []
        this.marks = []
        for (let grid of this.grids) {
            if (grid.isMine()) {
                this.mines.push(grid)
            }
            if (grid.mark) {
                this.marks.push(grid)
            }
        }
        this.remainMines = this.mines.length - this.marks.length
    }

    updateMineNum() {
        let element = e('#id-mineNum')
        element.innerHTML = `还剩 ${this.remainMines} 颗地雷`
    }

    update() {
        super.update()
        this.updateMineNum()
        if (this.firstClickXY !== null) {
            for (let grid of this.grids) {
                let e = this.getGridElement(grid.x, grid.y)
                e.classList.toggle('hide', grid.hide)
                e.classList.toggle('mark', grid.mark)
                e.classList.toggle('peer', grid.peer)
                e.classList.toggle('boom', grid.boom)
                if (!grid.hide && grid.num !== 0) {
                    if (e.innerHTML === '') {
                        e.innerHTML = grid.num
                    }
                    e.classList.add(`num${grid.num}`)
                }
            }

            this.updateMineMark()
            if (this.checkComplete()) {
                for (let mine of this.mines) {
                    let e = this.getGridElement(mine.x, mine.y)
                    e.innerHTML = mine.num
                    e.classList.add(`num${mine.num}`)
                    e.classList.add('finish')
                    e.classList.remove('hide')
                }
                this.updateMineNum()
                this.game.replaceScene(Win)
            }
        }
    }

    destory() {
        super.destory();
        let s = e('#id-game')
        s.removeEventListener('mouseup', this.mouseup)
        s.removeEventListener('mousedown', this.mousedown)
    }
}

class GameOver extends GameObject {
    constructor(game) {
        super();
        this.game = game
        this.element = e('#id-result')
        this.element.innerText = 'Game Over!'
    }

    destory() {
        super.destory();
        this.element.innerText = ' '
    }
}

class Win extends GameObject {
    constructor(game) {
        super();
        this.game = game
        this.element = e('#id-result')
        this.element.innerText = 'You Win!'
    }

    destory() {
        super.destory();
        this.element.innerText = ' '
    }
}

