const { fork } = require('child_process');
var streamN = 10
var socketsId = []
var forkeds = []

for(var i=0;i<streamN;i++){
	const forked = fork('stream_child.js');
	forked.indexOfForked = i
	forkeds.push(forked)
	forkeds[i].on('message', (msg) => {});
	forkeds[i].send({message_name:'set_stream_number',data:i});
}

process.on('message',(msg)=>{
	if(msg.message_name == 'user_ids'){
		for (var i = forkeds.length - 1; i >= 0; i--) {
			forkeds[msg[i].index].send({ message_name:'start_stream',id:msg[i].id})		
		}
	}
	startStream()	
})

var startStream = ()=>{
	//nkary kisum enq bajanum 8 masi uxarkum user
	for (var i = forkeds.length - 1; i >= 0; i--) {
		forkeds[i].send('jkhefjshdfkjhsfkjh')
	}
}

var startStreamHandshake = (allSockets)=>{
	
}