var socket, index, userId

var creatingSocket = (num)=>{

	socket = require('socket.io-client')('https://carinapp.herokuapp.com',{path: ('/stream'+num) })

	socket.on('connect', () => {
		process.send({message_name:'set_id',data:{id:socket.io.engine.id,index:num}})
	})

}

process.on('message', (msg) => {
	if(msg.message_name == 'set_stream_number'){
  		var index = msg.data
  		creatingSocket(msg.data)
	}else if(msg.message_name == 'start_stream'){
  		console.log('Stream started at index ::', index)
		userId = msg.id
	}else{
  		socket.emit('stream',{ id : userId, image : msg })
	}
});