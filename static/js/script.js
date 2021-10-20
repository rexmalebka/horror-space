import * as THREE from 'https://cdn.skypack.dev/three@latest'
import { PointerLockControls} from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/PointerLockControls.js'
import {initWorld, addAvatar} from "./World.js"

window.THREE = THREE
const initial_pos = {x: 23.7173, y: 2, z: 31.7031}
const initial_rot = {  y:0 }
/*
 *
A se conecta
B se conecta
A se mueve
B recibe movimientos
B se mueve, A no recibe movimientos


A se conecta
B se conecta
B se mueve
A NO recibe movimientos
A se mueve
B recibe movimientos 
 * */



function discover(){
        return fetch(`http://192.168.0.100:9000/piranhalab/peerjs/peers`)
        .then(response => response.json())
	.then(data => {
		data.forEach((peer)=> {
			app.addPeer(peer)
		})

		for(let peer in app.users){
			// if finds differences between discover list and actual list
			if(
				data.indexOf(peer)<0 
			){
				app.delPeer(peer)
			}
		}
	})
}

function dataHandler(peer, funcidx, data){
	const func = app.peerMessages[funcidx]
	if(func) func(peer, ...data)
}

const app = new Vue({
	el: '#app',
	watch: {
		users: function(newusers, olduser){
			console.debug("watch users", Object.keys(newusers), Object.keys(olduser))
			
		},
		position:{
			handler: function(pos){
				// move avatar and tell everyone 
				const avatar = this.three.scene.getObjectByName('avatar')
				if(avatar){
					avatar.position.set(pos.x, pos.y -2.01, pos.z)
				}
				for(let user in this.users){
					this.users[user].send([0,  pos.x, pos.z ])
				}
			},
			deep:true
		},
		rotation:{
			handler: function(rot){
				// move avatar and tell everyone 
				const avatar = this.three.scene.getObjectByName('avatar')
				if(avatar){
					avatar.rotation.set(0, -rot.y, 0)
					for(let user in this.users){
						this.users[user].send([1,  -rot.y ])
					}
				}
			},
			deep:true
		},
		alias:{
			handler: function(value){
				const avatar = this.three.scene.getObjectByName('avatar')
				if(avatar){
					for(let user in this.users){
						this.users[user].send([2, value ])
					}
				}
			}
		}
	},
	computed:{
		alias: {
			get: function(){
				const avatar = this.three.scene.getObjectByName(`avatar`)
				if(avatar){
					return avatar.userData.alias ? avatar.userData.alias : this.peer.id  
				}else{	
					return this.peer.id
				}
			}, 
			set: function(value){
				const avatar = this.three.scene.getObjectByName(`avatar`)
				if(avatar){
					this.$set(avatar.userData, 'alias', value)
				}	
			}
		},
		position: function(){
			const pos = this.three.camera.position
			return {
				x: parseFloat(
					pos.x.toString().match(/^-?\d+(?:\.\d{0,4})?/)[0]
				),
				y: parseFloat(
					pos.y.toString().match(/^-?\d+(?:\.\d{0,4})?/)[0]
				),
				z: parseFloat(
					pos.z.toString().match(/^-?\d+(?:\.\d{0,4})?/)[0]
				),
			}
		},
		rotation: function(){

			const rot = this.three.camera.rotation
			return {
				y: parseFloat(
					rot.y.toString().match(/^-?\d+(?:\.\d{0,4})?/)[0]
				),
			}

		}
	},
	data:{
		channel:'horror',
		peer:  new Peer({
			host:'/',
			port:9000,
			path:'/piranhalab'
		}),
		users: {},
		locked: false,
		three: {
			scene: new THREE.Scene(),
			camera:new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ),
			renderer: new THREE.WebGLRenderer(),
			animate:function(){
				requestAnimationFrame( app.three.animate );
				app.three.renderer.render( app.three.scene, app.three.camera );
			},
			moving : {
				forward: false,
				backward: false,
				left: false,
				right:false
			}
		},
		peerMessages:[
			function(peer, x, z){
				// 0 - change position 

				const avatar = app.three.scene.getObjectByName(`avatar-${peer}`)
				if(avatar && app.users[peer]){
					avatar.position.x = x
					avatar.position.z = z
				}
			},
			function(peer, rot){
				// 1 - change rotation
				
				const avatar = app.three.scene.getObjectByName(`avatar-${peer}`)
				if(avatar && app.users[peer]){
					avatar.rotation.y = rot
				}

			},
			function(peer, alias){
				// 2 - change alias
				const avatar = app.three.scene.getObjectByName(`avatar-${peer}`)
				if(avatar){
					avatar.userData.alias = alias
				}
			},
			function(peer, msg){
				// 3 - receive a msg in the chat
				console.debug("msg received", peer, msg)
				const avatar = app.three.scene.getObjectByName(`avatar-${peer}`)
				if(avatar){
					app.messages.push({
						peer: avatar.userData.alias,
						date: new Date(),
						text: msg
					})
				}
			}
		],
		chat_vis: true,
		chat_focused:false,
		msg: "",
		messages:[],
		touchPos:{x:0,y:0},
	},
	methods:{
		lockCamera: function(event){
			if(document.activeElement == this.$el &&
				(
					document.querySelector("#lockscreen").contains(event.target) ||
					document.querySelector("canvas").contains(event.target)

				)){
				this.three.controls.lock()
				this.chat_focused = false
			}
		},
		send_msg: function(){
			const msg = app.msg.trim()
			if(msg.length > 0){
				app.messages.push({
					peer: app.alias,
					date: new Date(),
					text: app.msg
				})

				for(let user in app.users){
					app.users[user].send([3, app.msg])
				}
			}
			app.msg = ""

		},
		moveForward: function(moving){
			if(document.activeElement == this.$el){
				this.three.moving.forward = moving
			}
		},
		moveBackward: function(moving){
			if(document.activeElement == this.$el){
				this.three.moving.backward = moving
			}
		},

		moveRight: function(moving){
			if(document.activeElement == this.$el){
				this.three.moving.right = moving
			}
		},
		moveLeft: function(moving){
			if(document.activeElement == this.$el){
				this.three.moving.left = moving
			}
		},


		addPeer: function(peer, conn){

			if(!app.users[peer] && peer != app.peer.id){

				let emit_conn = this.peer.connect(peer, {
					label:"horror",
					metadata:[
						app.position.x,		
						app.position.z,
						app.rotation.y
					],
				})
				this.$set(this.users, peer, emit_conn)

				addAvatar(this.three.scene, `avatar-${peer}`).then(function(avatar){
					avatar.userData.alias = `avatar-${peer}`
					if(conn && Array.isArray(conn.metadata)){
						if(! isNaN(conn.metadata[0])) avatar.position.x = conn.metadata[0]
						if(! isNaN(conn.metadata[1])) avatar.position.z = conn.metadata[1]
						if(! isNaN(conn.metadata[2])) avatar.rotation.y = conn.metadata[2]
					}
				})
				
			}

		},
		delPeer: function(peer){


			this.users[peer].close()
			this.$delete(app.users, peer)

			const avatar = this.three.scene.getObjectByName(`avatar-${peer}`)
			
			if(avatar){
				avatar.children.forEach(function(obj){
					if(obj.isMesh){
						obj.material.dispose()
						obj.geometry.dispose()
					}else{
						avatar.remove(obj)
					}
				})
				this.three.scene.remove(avatar)
				this.three.renderer.renderLists.dispose();
			}
			console.debug(`${peer} is left`)

		},
		toggle_chat: function(){
			this.chat_vis = !this.chat_vis 
		},


		isMobile: function() {
			if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				return true
			} else {
				return false
			}
		},
		touchStart: function(e){
			const pos = {
				x:e.changedTouches[0].clientX,
				y:e.changedTouches[0].clientY
			}
			console.debug("ev start", pos)
			app.touchPos.x = pos.x
			app.touchPos.y = pos.y
		},
		touchMove: function(e){
			const pos = {
				x:e.changedTouches[0].clientX,
				y:e.changedTouches[0].clientY
			}
			const dx = app.touchPos.x - pos.x
			const dy = (app.touchPos.y - pos.y) 

			console.debug("ev move", app.touchPos, dy)
			if(Math.abs(dy) > 120){
				if(dy<0){
					app.moveBackward(true)
				}else{
					app.moveForward(true)
				}
			}
			if(Math.abs(dx) > 120){
				if(dx<0){
					app.three.camera.rotation.y += 0.01
				}else{
					app.three.camera.rotation.y -= 0.01
				}
			}
			/*
			if(dist>80){
				app.three.camera.rotation.y += m 
			}
			*/
			
		},
		touchEnd: function(e){
			app.moveForward(false)
			app.moveBackward(false)
		},
	},
	mounted: function(){
		const channel = this.channel
		
		// add three js stuff renderer and appending
		this.three.renderer.setSize( window.innerWidth, window.innerHeight );
		this.$el.appendChild( this.three.renderer.domElement );

		// fixes aspect when window resizes
		window.addEventListener('resize',function(){
			app.three.camera.aspect = window.innerWidth / window.innerHeight;
			app.three.camera.updateProjectionMatrix();
			app.three.renderer.setSize( window.innerWidth, window.innerHeight );
		})

		// set camera for vision
		this.three.camera.position.set(initial_pos.x, 2, initial_pos.y)


		// set controls
		this.three.controls = new PointerLockControls(this.three.camera, this.$el)

		this.three.controls.addEventListener( 'lock', function () {
			app.locked = true
		});

		this.three.controls.addEventListener( 'unlock', function () {
			app.locked = false
		});

		setInterval(function(){
			const direction = new THREE.Vector3();
			direction.z = Number(app.three.moving.forward) - Number(app.three.moving.backward);
			direction.x = Number(app.three.moving.right) - Number(app.three.moving.left);
			if (direction.z != 0 || direction.x != 0) {
				app.three.controls.moveForward(0.1 * direction.z)
				app.three.controls.moveRight(0.1 * direction.x)
			}
		}, 50)

		// init creating meshes
		initWorld(this.three.scene, this.three.camera)


		// init with animation
		requestAnimationFrame( this.three.animate );

		// peer js event listener
		this.peer.on('open', function(conn){
			// adding myself
			addAvatar(app.three.scene,'avatar').then(function(avatar){
				app.alias = app.peer.id
				avatar.position.x = app.position.x
				avatar.position.z = app.position.z
				avatar.rotation.y = app.position.y
				
			})

			app.peer.on('connection', function(conn){
				app.addPeer(conn.peer, conn)
				conn.on('data', function(data){
					dataHandler(conn.peer, data[0], data.slice(1))
				})	
			})

			setInterval(function(){
				// discover new people
				discover()
/*
				*/

			}, 2000)

		})


	}
})

window.app = app
