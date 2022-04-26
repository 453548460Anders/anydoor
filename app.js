const http = require('http');
// const chalk = require('chalk')
const conf = require('./defaultConfig')
const path = require('path')
const route = require('./helper/router')
const openUrl = require('./helper/openUrl')
class Server {
    constructor (config) {
        this.conf = Object.assign({}, conf, config)
    }
    start() {
        const server = http.createServer((req, res) => {
            const url = req.url
            const filePath = path.join(this.conf.root, url)
            route(filePath, req, res, this.conf)
        })
        
        server.listen(this.conf.port, this.conf.hostname, ()=> {
            const addr = `http://${this.conf.hostname}:${this.conf.port}`
            openUrl(addr)
            console.info(`Server started at ${(addr)}`)
        })
    }
}

module.exports = Server;
