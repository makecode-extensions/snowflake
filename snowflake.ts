/**
 * snowflake christmas tree extension for 16 x 16 neopixel matrix
 * From microbit/micropython Chinese community.
 * http://www.micropython.org.cn
 */

// default backgroud christmas tree
let default_BG = [
    0x000000, 0x060000, 0x000000, 0x000000,
    0x000000, 0x000000, 0x000000, 0x000000,
    0x000000, 0x000000, 0x000000, 0x000000,
    0x0A0000, 0x060000, 0x000060, 0x000000,
    0x000000, 0x060000, 0x060060, 0x0A00A0,
    0x0F0000, 0x000000, 0x000000, 0x000000,
    0x000000, 0x000000, 0x0F0000, 0x0A00F0,
    0x0A00A0, 0x060060, 0x000060, 0x000000,
    0x024024, 0x060024, 0x060060, 0x0A00A0,
    0x0F00A0, 0x0F00F0, 0x000000, 0x000000,
    0x000000, 0x000000, 0x0F0000, 0x0A00F0,
    0x0A00A0, 0x060060, 0x000060, 0x000000,
    0x000000, 0x060000, 0x060060, 0x0A00A0,
    0x0F0000, 0x000000, 0x000000, 0x000000,
    0x000000, 0x000000, 0x000000, 0x000000,
    0x0A0000, 0x060000, 0x000060, 0x000000,
    0x000000, 0x060000, 0x000000, 0x000000,
    0x000000, 0x000000, 0x000000, 0x000000,
]

//% weight=50 color=#202020 icon="\uf2dc" block="snow flake"
namespace snowflake {
    let _update = false
    let _pin: DigitalPin
    let _cover = false
    let _threshold = 8
    let _snowfall = 50
    let _MostAtATime = 3
    let _speed = 50
    let _np: neopixel.Strip = null
    let _pile: number[][] = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
    let _snow: number[][] = []
    let _BG: number[] = []
    _BG = default_BG

    control.inBackground(function update() {
        while (true) {
            if (_update) {
                if (_snow.length > 0) {
                    _fall()
                    _np.show()
                    _del()
                }
                _new()
                basic.pause(_speed)
            }
            else {
                basic.pause(100)
            }
        }
    })

    function load_bg(dat: number[]): void {
        let t: number
        let r: number
        let g: number
        let b: number
        for (let x = 0; x < 16; x++)
            for (let y = 0; y < 8; y++) {
                if (dat.length > (x * 8 + y)) t = dat[x * 8 + y]
                else t = 0
                r = t % 16
                g = (t >> 4) % 16
                b = (t >> 8) % 16
                if (x % 2) setpixel(y * 2, x, [r, g, b])
                else setpixel(15 - y * 2, x, [r, g, b])
                r = (t >> 12) % 16
                g = (t >> 16) % 16
                b = (t >> 20) % 16
                if (x % 2) setpixel(y * 2 + 1, x, [r, g, b])
                else setpixel(14 - y * 2, x, [r, g, b])
            }
    }

    /* 
     * load back groud picture
     * @param dat is picture data, it can be convert by microbittoolbox
     * https://github.com/shaoziyang/microbit-lib/tree/master/utils/microbit_toolbox
     */
    //% block="load background picture %dat=variables_get(BG)"
    //% weight=120
    export function load_background(dat: number[]): void {
        _BG = dat
        load_bg(_BG)
    }

    /* 
     * load default back groud picture: christmas tree
     */
    //% block="load default background picture"
    //% weight=125
    export function load_default_backgroud(): void {
        _BG = default_BG
        load_bg(_BG)
    }

    // overlying two color
    function overlying(row: number, col: number, color: number[], add: boolean): void {
        let c = getpixel(row, col)
        if (add) setpixel(row, col, [c[0] + color[0], c[1] + color[1], c[2] + color[2]])
        else setpixel(row, col, [c[0] - color[0], c[1] - color[1], c[2] - color[2]])
    }

    //% block="set pixel row %row|col %col|color %color"
    function setpixel(row: number, col: number, color: number[]): void {
        if (col % 2) _np.setPixelColor(col * 16 + 15 - row, neopixel.rgb(color[0], color[1], color[2]))
        else _np.setPixelColor(col * 16 + row, neopixel.rgb(color[0], color[1], color[2]))
    }

    //% block="get pixel row %row|col %col"
    function getpixel(row: number, col: number): number[] {
        let r = 0
        let g = 0
        let b = 0
        let offset = 0
        if (col % 2) offset = col * 16 + 15 - row
        else offset = col * 16 + row

        let stride = _np._mode === NeoPixelMode.RGBW ? 4 : 3;
        offset = (offset + _np.start) * stride;

        if (_np._mode === NeoPixelMode.RGB_RGB) {
            r = _np.buf[offset + 0];
            g = _np.buf[offset + 1];
        } else {
            g = _np.buf[offset + 0];
            r = _np.buf[offset + 1];
        }
        b = _np.buf[offset + 2];
        return [r, g, b]
    }

    /**
     * config snwo flake
     * 
     */
    //% block="config Pin %pin|cover %cover|threshold %threshold|snowfall %snowfall|most at a time %MostAtATime|speed %speed"
    //% cover.defl=false
    //% pin.defl=DigitalPin.P1
    //% threshold.defl=8 threshold.max=100 threshold.min=1
    //% snowfall.defl=50 snowfall.max=100 snowfall.min=1
    //% MostAtATime.defl=1 MostAtATime.max=9 MostAtATime.min=1
    //% speed.defl=50 speed.max=500 speed.min=10
    //% weight=100
    export function config(pin: DigitalPin, cover: boolean, threshold: number, snowfall: number, MostAtATime: number, speed: number) {
        _pin = pin
        _cover = cover
        _threshold = threshold
        _snowfall = snowfall
        _MostAtATime = MostAtATime
        _speed = speed
        _np = neopixel.create(_pin, 256, NeoPixelMode.RGB)
        _np.clear()
        load_bg(_BG)
        for (let i = 0; i < 16; i++)
            _pile[4][i] = _threshold
    }

    /**
     * start running
     */
    //% block="start"
    //% weight = 80
    export function start(): void {
        _update = true
    }

    /**
     * pause running
     */
    //% block="pause"
    //% weight = 70
    export function pause(): void {
        _update = false
    }

    /**
     * Restart again
     */
    //% block="reset"
    //% weight = 60
    export function reset() {
        _pile = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
        _snow = []
        load_bg(_BG)
        _np.show()
        for (let i = 0; i < 16; i++)
            _pile[4][i] = _threshold
    }

    // create new snow flake
    function _new() {
        if (Math.randomRange(1, 100) < _snowfall) {
            for (let i = 0; i < _MostAtATime; i++) {
                _snow.push([-1, Math.randomRange(0, 16), Math.randomRange(1, 16)])
            }
        }
    }

    // snow flake falling down
    function _fall() {
        for (let i = 0; i < _snow.length; i++) {
            let c = _snow[i]
            if (c[0] > -1) {
                overlying(c[0], c[1], [c[2], c[2], c[2]], false)
            }
            c[0] += 1
            c[1] += Math.randomRange(-1, 1)
            c[1] = Math.max(0, Math.min(c[1], 15))
            overlying(c[0], c[1], [c[2], c[2], c[2]], true)
        }
    }

    // delete a snow flake when it reach the bottom
    function _del() {
        let n = _snow.length
        if (_cover) {
            for (let i = 0; i < n; i++) {
                let a: boolean
                let b: boolean
                let c = _snow[n - 1 - i]
                let row = c[0]
                let col = c[1]
                if (row < 12) continue
                if (col == 0) {
                    a = true
                    b = _pile[row - 11][col + 1] >= _threshold ? true : false
                } else if (col == 15) {
                    a = _pile[row - 11][col - 1] >= _threshold ? true : false
                    b = true
                } else {
                    a = _pile[row - 11][col - 1] >= _threshold ? true : false
                    b = _pile[row - 11][col + 1] >= _threshold ? true : false
                }
                if (_pile[row - 11][col] >= _threshold) {
                    overlying(c[0], c[1], [c[2], c[2], c[2]], false)
                    if (a && b) {
                        if (_pile[row - 12][col] < _threshold) {
                            _pile[row - 12][col] += c[2]
                            if (_pile[row - 12][col] >= _threshold) {
                                overlying(c[0], c[1], [8, 8, 8], true)
                                _line()
                            }
                        }
                    }
                    _snow.removeAt(n - 1 - i)
                }
            }
        }
        else {
            for (let i = 0; i < n; i++) {
                let c = _snow[n - 1 - i]
                if (c[0] > 14) {
                    overlying(c[0], c[1], [c[2], c[2], c[2]], false)
                    _snow.removeAt(n - 1 - i)
                }
            }

        }
    }

    // delete last line when it fill, and move down other lines
    function _line() {
        for (let i = 0; i < 16; i++) {
            if (_pile[3][i] < _threshold)
                return
        }
        for (let i = 0; i < 16; i++) {
            overlying(15, i, [15, 0, 0], true)
        }
        _np.show()
        basic.pause(300)
        for (let i = 0; i < 16; i++) {
            overlying(15, i, [15, 0, 0], false)
        }
        for (let j = 0; j < 3; j++) {
            for (let i = 0; i < 16; i++) {
                if (_pile[3 - j][i] >= _threshold)
                    overlying(15 - j, i, [8, 8, 8], false)
            }
            _np.show()
            basic.pause(300)
            for (let i = 0; i < 16; i++) {
                _pile[3 - j][i] = _pile[2 - j][i]
                if (_pile[3 - j][i] >= _threshold)
                    overlying(15 - j, i, [8, 8, 8], true)
            }
        }
        for (let i = 0; i < 16; i++)
            if (_pile[0][i] >= _threshold)
                overlying(12, i, [8, 8, 8], false)
        _pile[0] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
}