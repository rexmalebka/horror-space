const { ExpressPeerServer } = require('peer')
const express = require('express')


function generate_id(){
	return `alias-${Math.random().toString(36).substr(2,6)}`
}

const app = express()

app.use(express.static('../static'))

const webserver = app.listen(9000)
const peerServer = ExpressPeerServer(webserver, {
	path:'/horror',
	generateClientId: generate_id,
	allow_discovery: true
})

app.use('/peerjs', peerServer)

console.info(`running webserver on port 9000`)
console.info(`running peerSever on path /horror`)
console.info(`running turnSever`)
