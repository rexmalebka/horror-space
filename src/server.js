const { PeerServer } = require('peer')

function generate_id(){
	return `alias-${Math.random().toString(36).substr(2,6)}`
}

const peerServer = PeerServer({
	host:"0.0.0.0",
	port:9000,
	path:'/piranhalab',
	generateClientId: generate_id,
	allow_discovery: true
})
