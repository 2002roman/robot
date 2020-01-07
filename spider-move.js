var math = Math
math.degrees = (radians)=>{
  var pi = Math.PI;
  return radians * (180/pi);
}
math.pi = math.PI
const Gpio = require('pigpio').Gpio
const delay = require('delay')
math.fabs = math.abs

class spiderMove{
    constructor(spiderConfigurations){
        var self = this    
        self.footPart1S = spiderConfigurations.footPart1S | 4
        self.footPart2S = spiderConfigurations.footPart2S | 5
        self.footPart3S = spiderConfigurations.footPart3S | 8
        self.servoMaxInPWM = spiderConfigurations.servoMaxInPWM | 2500
        self.servoMinInPWM = spiderConfigurations.servoMinInPWM | 600
        self.high = spiderConfigurations.high | 8
        self.highMax = spiderConfigurations.highMax | 10
        self.highMin = spiderConfigurations.highMin | 5
        self.breakCall = false
        self.motorFlipSpeed = 0.9
        self.Motors = self.setupMotors(spiderConfigurations.pinsLayout)
    }

    setupMotors(pinsLayout){
        var self = this
        var Motors = []
        for(var i=0;i<pinsLayout.length;i++){
            var footMotors = []
            footMotors.push(new Gpio(pinsLayout[i][0], {mode: Gpio.OUTPUT}))
            footMotors.push(new Gpio(pinsLayout[i][1], {mode: Gpio.OUTPUT}))
            footMotors.push(new Gpio(pinsLayout[i][2], {mode: Gpio.OUTPUT}))
            Motors.push(footMotors)
        }
        return Motors
    }

    degreeToPulse(degree){
        var self = this
        return (((self.servoMaxInPWM-self.servoMinInPWM)/180)*(degree))+self.servoMinInPWM
    }

    nodeDelayControll(degree){
        var self = this
        return self.servoFlipSpeed/180*degree*1000
    }

    mirrorCheck(mirrorProperty,degree){
        if(mirrorProperty){            
            return (180-degree)
        }else{
            return degree
        }
    }

    highControl(high){        
        var self = this
        if(high > self.highMin && high < self.highMax){
            self.high = high
            if(high == self.footPart3S){
                return {
                    "Alfa" : 90,
                    "Betta" : 90,
                    "Gamma" : 90
                }
            }else if(high > self.footPart3S){
                return {
                    "Alfa" : 90,
                    "Gamma" : (90 - math.degrees(math.asin((high-self.footPart3S)/self.footPart2S))),
                    "Betta" : math.degrees(math.acos((high-self.footPart3S)/self.footPart2S))
                }
            }else if(high < self.footPart3S){
                return {
                    "Alfa" : 90,
                    "Betta" : 90+(math.degrees(math.asin((self.footPart3S-high)/self.footPart2S))),
                    "Gamma" : 180-math.degrees(math.acos((self.footPart3S-high)/self.footPart2S))
                }
            }
        }else{
            self.high = self.footPart3S
            return {
                "Alfa":90,
                "Betta":90,
                "Gamma":90
            }
        }
    }

    yAxisStepControl(Node){
        var self = this
        var d = 0
        if(self.high == self.footPart3S){
            var e = math.cos(Node * math.pi / 180)
            var b = math.pow((self.footPart2S + self.footPart1S / e) - self.footPart1S,2)
            d = math.sqrt(math.pow(self.high,2)+b)
        }else{
            var e = math.cos(Node * math.pi / 180)
            var t = math.pow( math.fabs( self.high - self.footPart3S ) , 2 )
            var f = math.sqrt( math.pow( self.footPart2S ,2 ) - t )
            var b = math.pow(((f+self.footPart1S)/e) - self.footPart1S,2)
            d = math.sqrt(math.pow(self.high,2)+b)
        }
        var Betta = (180*math.acos(self.high/d)/math.pi)+(180*math.acos((math.pow(self.footPart2S,2)+math.pow(d,2)-math.pow(self.footPart3S,2))/(2*d*self.footPart2S))/math.pi)
        var Gamma = 180-(180*math.acos((math.pow(self.footPart3S,2)+math.pow(self.footPart2S,2)-math.pow(d,2))/(2*self.footPart2S*self.footPart3S))/math.pi)
        return {
            "A":{
                "Alfa" : 90+Node,
                "Betta" : Betta,
                "Gamma" : Gamma
                },
            "B":{
                "Alfa" : 90-Node,
                "Betta" : Betta,
                "Gamma" : Gamma
                }
        }
    }
    
    xAxisStepControl(d){       
        var self = this
        var sForA = 0
        var sForB = 0
        if(self.high == self.footPart3S){
            sForA = math.sqrt(math.pow(self.footPart2S + d,2)+math.pow(self.high,2))
            sForB = math.sqrt(math.pow(self.footPart2S - d,2)+math.pow(self.high,2))
        }else{
            sForA = math.sqrt(math.sqrt(math.pow(self.footPart2S,2)-(math.pow(math.fabs(self.high - self.footPart3S),2)))+math.pow(self.high,2)+d)
            sForB = math.sqrt(math.sqrt(math.pow(self.footPart2S,2)-(math.pow(math.fabs(self.high - self.footPart3S),2)))+math.pow(self.high,2)-d)
        }
        return {
            "A":{
                "Alfa" : 90,
                "Betta" : (180*math.acos(self.high/sForA)/math.pi)+(180*math.acos((math.pow(self.footPart2S,2)+math.pow(sForA,2)-math.pow(self.footPart3S,2))/(2*sForA*self.footPart2S))/math.pi),
                "Gamma" : 180-180*math.acos((math.pow(self.footPart3S,2)+math.pow(self.footPart2S,2)-math.pow(sForA,2))/(2*self.footPart2S*self.footPart3S))/math.pi
            },
            "B":{
                "Alfa" : 90,
                "Betta" : (180*math.acos(self.high/sForB)/math.pi)+(180*math.acos((math.pow(self.footPart2S,2)+math.pow(sForB,2)-math.pow(self.footPart3S,2))/(2*sForB*self.footPart2S))/math.pi),
                "Gamma" : 180-180*math.acos((math.pow(self.footPart3S,2)+math.pow(self.footPart2S,2)-math.pow(sForB,2))/(2*self.footPart2S*self.footPart3S))/math.pi
            }
        }
    }
    
    attribution(footNum,objInfo,mirrorProperty){
        var self = this
        Motors[(footNum-1)*3+2].ChangeDutyCycle(self.degreeToPulse(90))
        Motors[(footNum-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["Betta"])))
        Motors[(footNum-1)*3+0].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["Gamma"])))
    }
    
    async spiderHighControl(newHigh,delayTime = 500){
        var self = this
        var step1 = self.highControl(newHigh)
        step1.Betta = 160
        var step2 = self.highControl(newHigh)
        
        this.moveFoot(1,step1)
        this.moveFoot(4,step1)
        this.moveFoot(5,step1)
        
        await delay(500)
        
        this.moveFoot(1,step2)
        this.moveFoot(4,step2)
        this.moveFoot(5,step2)

        await delay(500)

        this.moveFoot(2,step1)
        this.moveFoot(3,step1)
        this.moveFoot(6,step1)
        
        await delay(500)
        
        this.moveFoot(2,step2)
        this.moveFoot(3,step2)
        this.moveFoot(6,step2)
    }
    
    setMotorPWM(footNumber,partNumber,degree){
        this.Motors[footNumber-1][partNumber-1].servoWrite(math.floor(this.degreeToPulse(degree)))
    }
    
    moveFoot(index,degrees,mirrorProperty = false){
    	this.setMotorPWM(index,1,degrees.Alfa)
        this.setMotorPWM(index,2,this.mirrorCheck(mirrorProperty,degrees.Betta))
        this.setMotorPWM(index,3,this.mirrorCheck(mirrorProperty,degrees.Gamma))
    }
    
    yAxisMove(direction,angle,delayTime = 1000){
        var self = this
        var config = {}
        config.delayTime = delayTime
        switch(direction){
            case 'up':
                config.step1 = this.highControl(6)
                config.step2 = this.highControl(6)
                config.step2.Betta = 160
                config.step3 = this.yAxisStepControl(angle).A
                self.move(config)
            case 'down':
                config.step1 = this.highControl(6)
                config.step2 = this.highControl(6)
                config.step2.Betta = 160
                config.step3 = this.yAxisStepControl(angle).B
                self.move(config)
        }
    }

    xAxisMove(direction,sizeStep,delayTime = 1000){
        var self = this
        var config = {}
        config.delayTime = delayTime
        switch(direction){
            case 'left':
                config.step1 = this.highControl(6)
                config.step2 = this.highControl(6)
                config.step2.Betta = 160
                config.step3 = this.xAxisStepControl(sizeStep).A
                self.move(config)
            case 'right':
                config.step1 = this.highControl(6)
                config.step2 = this.highControl(6)
                config.step2.Betta = 160
                config.step3 = this.xAxisStepControl(sizeStep).B
                self.move(config)
        }
    }

    async move(config){
        var groupStartStep1 = 1
        var groupStartStep2 = 3
        // spider.breakCall = false
        while (true){
            console.log(self.breakCal)
            if( this.breakCall ){
                this.breakCall = false
                break
            }
        	switch(groupStartStep1){
                case 1:
                    var controlledFoot = config.step1
                    this.moveFoot(2,controlledFoot,false)
                    this.moveFoot(3,controlledFoot,true)
                    this.moveFoot(6,controlledFoot,false)
                    groupStartStep1 = 2
                    break
                case 2:
                    var controlledFoot = config.step2
                    this.moveFoot(2,controlledFoot,false)
                    this.moveFoot(3,controlledFoot,true)
                    this.moveFoot(6,controlledFoot,false)
                    groupStartStep1 = 3
                    break
                case 3:
                    var controlledFoot = config.step3
                    this.moveFoot(2,controlledFoot,false)
                    this.moveFoot(3,controlledFoot,true)
                    this.moveFoot(6,controlledFoot,false)
                    groupStartStep1 = 1
                    break
            }
            switch(groupStartStep2){
                case 1:
                    var controlledFoot = config.step1
                    this.moveFoot(1,controlledFoot,true)
                    this.moveFoot(4,controlledFoot,false)
                    this.moveFoot(5,controlledFoot,true)
                    groupStartStep2 = 2
                    break
                case 2:
                    var controlledFoot = config.step2
                    this.moveFoot(1,controlledFoot,true)
                    this.moveFoot(4,controlledFoot,false)
                    this.moveFoot(5,controlledFoot,true)
                    groupStartStep2 = 3
                    break
                case 3:
                    var controlledFoot = config.step3
                    this.moveFoot(1,controlledFoot,true)
                    this.moveFoot(4,controlledFoot,false)
                    this.moveFoot(5,controlledFoot,true)
                    groupStartStep2 = 1
                    break
            }
            await delay(config.delayTime)
        }
    }
}

var spiderCon = {
    footPart1S:4,
    footPart2S:5,
    footPart3S:8,
    servoMaxInPWM:2500,
    servoMinInPWM:600,
    high:8,
    highMax:10,
    highMin:5,
    pinsLayout:[
        [2,3,4],
        [14,15,18],
        [22,10,9],
        [23,24,25],
        [21,20,16],
        [26,19,13]
    ]
}

var spider = {}

process.on('message',(msg)=>{
    if( msg.message_name == 'configs' ){
        
        spider = new spiderMove( spiderCon )
    
    } else{
        switch( msg ){
            case 'up':
                spider.breakCall = true
                
                setTimeout(()=>{
                    spider.yAxisMove( 'up', 30 )
                },10)
                break
            case 'down':
                // spider.stop()
                spider.breakCall = true

                setTimeout(()=>{
                    spider.yAxisMove( 'down', 30 )
                },10)
                break
            case 'left':
                // spider.stop()
                spider.breakCall = true
                
                setTimeout(()=>{
                    spider.xAxisMove( 'left', 3 )
                },10)
                break
            case 'right':
                // spider.stop()
                spider.breakCall = true
                setTimeout(()=>{
                    spider.xAxisMove( 'right', 3 )
                },10)
                break
            case 'stop':
                // spider.stop()
                spider.breakCall = true
                
                break
        }
    }
})