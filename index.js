var socket = require('socket.io-client')('https://carinapp.herokuapp.com',{path:'/auth'});
const { fork } = require('child_process');

const jsonString = require('fs').readFileSync('config/projectData.json', 'utf8');
var projectData = JSON.parse(jsonString)[0];

socket.on('connect', () => {
	console.log('You are connected in server\nRobot session-id: ',socket.io.engine.id)
	
	socket.emit('verifyRobotAndTurnOn', {
		uniqueDataOfUser : projectData.uniquedataofuser,
		id : projectData.id
	});

	socket.on('verifyRobotAndTurnOn_res',(res)=>{
		console.log(res)
		if(res.status == 'error') process.exit(1)
		else console.log('\n\n\tWaiting for connection ...')
	})

	socket.on('handshake',(res)=>{
		socket.user_id = res.id
		socket.emit('setUserIdFromRobot',socket.user_id)
		console.log('Handshake have been success\n User session id: ',socket.user_id)
		startRobotMove(socket)
		startStream(socket)
	})

	socket.on('disconnect',()=>{
		console.log('you are disconected')
		socket.emit('disconnect',{
			uniqueDataOfUser : projectData.uniquedataofuser,
			id : projectData.id
		})
	})
})

let startStream = (socket)=>{
	console.log('Stream function is started use')
	const stream = fork('stream.js');
	socket.on('userIds',(data)=>{
		stream.send({message_name : 'user_ids',data})
	})
	stream.on('message',(msg)=>{
		if(msg.message_name=='startStreamHandshake'){
		}
	})
}

let startRobotMove = (socket)=>{
	const spiderMove = fork('spider-move.js');
	spiderMove.send({ message_name : 'configs', data : projectData})
	spiderMove.on('message',(msg)=>{
		console.log(msg)
	})
	socket.on('direction',(data)=>{
		if(data.id == socket.user_id){
			spiderMove.send(data.direction)
		}
	})
}