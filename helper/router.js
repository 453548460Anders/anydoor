const fs = require('fs')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const HandleBars = require('handlebars')
const path = require('path')
const tplPath = path.join(__dirname, '../template/dir.html')
const source = fs.readFileSync(tplPath)
const template = HandleBars.compile(source.toString())
const mime = require('../helper/mime')
const compress = require('./compress')
const range = require('./range')
const isFresh = require('./cache')

module.exports = async function(filePath, req, res, conf) {
    try {
        const stats = await stat(filePath)
        if (stats.isFile()) {
            const contentType =  mime(filePath)
            res.setHeader('Content-Type', contentType)

            if (isFresh(stats, req, res)) {
                res.statusCode = 304
                res.end()
                return
            }
            let rs ;
            const {code, start, end} = range(stats.size, req, res)
            if (code === 200) {
                res.statusCode = 200
                rs = fs.createReadStream(filePath)
            } else {
                res.statusCode = 206
                rs = fs.createReadStream(filePath, {start, end})
            }
            if (filePath.match(conf.compress)) {
                // 压缩之后, 减小文件大小, 提升传输速度
                rs = compress(rs, req, res)
            }
            rs.pipe(res)
        } else if (stats.isDirectory()){
            const files = await readdir(filePath)
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            const dir = path.relative(conf.root, filePath)
            const data = {
                title: path.basename(filePath),
                dir: `${dir}`,
                files
            }
            res.end(template(data))
        }
    } catch (err) {
        console.error(err);
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain')
        res.end(`${filePath} is not a directory or file \n ${err.toString()}`)
    }
}