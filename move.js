var math = Math
math.degrees = (radians)=>{
  var PI = Math.PI;
  return radians * (180/PI);
}
// const Gpio = require('PIgPIo').Gpio

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
            // footMotors.push(new Gpio(pinsLayout[i][0], {mode: Gpio.OUTPUT}))
            // footMotors.push(new Gpio(pinsLayout[i][1], {mode: Gpio.OUTPUT}))
            // footMotors.push(new Gpio(pinsLayout[i][2], {mode: Gpio.OUTPUT}))
            
            //////////test

            footMotors.push(pinsLayout[i][0])
            footMotors.push(pinsLayout[i][1])
            footMotors.push(pinsLayout[i][2])

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
            var e = math.cos(Node * math.PI / 180)
            var b = math.pow((self.footPart2S + self.footPart1S / e) - self.footPart1S,2)
            var d = math.sqrt(math.pow(self.high,2)+b)
        }else{
            var e = math.cos(Node * math.PI / 180)
            var t = math.pow( math.fabs( self.high - self.footPart3S ) , 2 )
            var f = math.sqrt( math.pow( self.footPart2S ,2 ) - t )
            var b = math.pow(((f+self.footPart1S)/e) - self.footPart1S,2)
            var d = math.sqrt(math.pow(self.high,2)+b)
        }
        var Betta = (180*math.acos(self.high/d)/math.PI)+(180*math.acos((math.pow(self.footPart2S,2)+math.pow(d,2)-math.pow(self.footPart3S,2))/(2*d*self.footPart2S))/math.PI)
        var Gamma = 180-(180*math.acos((math.pow(self.footPart3S,2)+math.pow(self.footPart2S,2)-math.pow(d,2))/(2*self.footPart2S*self.footPart3S))/math.PI)
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
                "Betta" : (180*math.acos(self.high/sForA)/math.PI)+(180*math.acos((math.pow(self.footPart2S,2)+math.pow(sForA,2)-math.pow(self.footPart3S,2))/(2*sForA*self.footPart2S))/math.PI),
                "Gamma" : 180-180*math.acos((math.pow(self.footPart3S,2)+math.pow(self.footPart2S,2)-math.pow(sForA,2))/(2*self.footPart2S*self.footPart3S))/math.PI
            },
            "B":{
                "Alfa" : 90,
                "Betta" : (180*math.acos(self.high/sForB)/math.PI)+(180*math.acos((math.pow(self.footPart2S,2)+math.pow(sForB,2)-math.pow(self.footPart3S,2))/(2*sForB*self.footPart2S))/math.PI),
                "Gamma" : 180-180*math.acos((math.pow(self.footPart3S,2)+math.pow(self.footPart2S,2)-math.pow(sForB,2))/(2*self.footPart2S*self.footPart3S))/math.PI
            }
        }
    }

    attribution(footNum,objInfo,mirrorProperty){
        var self = this
        Motors[(footNum-1)*3+2].ChangeDutyCycle(self.degreeToPulse(90))
        Motors[(footNum-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["Betta"])))
        Motors[(footNum-1)*3+0].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["Gamma"])))
    }

    xAxisStep(direction){
        var self = this
        var zeroLevel = self.highControl(self.high)
        var stepA  = self.xAxisStepControl(2)["A"]
        var delayTime = 0.5
        var stepB = self.xAxisStepControl(2)["B"]
                
        var objInfoForA = {
            "step" : stepA,
            "zeroLevel" : zeroLevel,
            "delayTime" : delayTime
        }
        var objInfoForB = {
            "step" : stepB,
            "zeroLevel" : zeroLevel,
            "delayTime" : delayTime
        }
        print(objInfoForB)
        if(direction == "left"){
            threading.Thread(target=self.footStep,args=[1,objInfoForB,false]).start()
            threading.Thread(target=self.footStep,args=[3,objInfoForA,true]).start()
            threading.Thread(target=self.footStep,args=[5,objInfoForA,false]).start()
            time.sleep(delayTime*2)
            threading.Thread(target=self.footStep,args=[2,objInfoForA,true]).start()
            threading.Thread(target=self.footStep,args=[4,objInfoForB,true]).start()
            threading.Thread(target=self.footStep,args=[6,objInfoForA,false]).start()
        }else if(direction == "right"){
            threading.Thread(target=self.footStep,args=[1,objInfoForA,false]).start()
            threading.Thread(target=self.footStep,args=[3,objInfoForB,true]).start()
            threading.Thread(target=self.footStep,args=[5,objInfoForB,false]).start()
            time.sleep(delayTime*2)
            threading.Thread(target=self.footStep,args=[2,objInfoForB,true]).start()
            threading.Thread(target=self.footStep,args=[4,objInfoForA,true]).start()
            threading.Thread(target=self.footStep,args=[6,objInfoForB,false]).start()
        }
        print("ok")
    }

    yAxisStep(direction){
        var self = this
        var zeroLevel = self.highControl(self.high)
        var stepA = self.yAxisStepControl(30)["A"]
        var delayTime = 0.5 
        var stepB = self.yAxisStepControl(30)['B']
        var objInfoForA = {
            "step" : stepA,
            "zeroLevel" : zeroLevel,
            "delayTime" : delayTime
        }
        var objInfoForB = {
            "step" : stepB,
            "zeroLevel" : zeroLevel,
            "delayTime" : delayTime
        }   
        print(objInfoForA)
        if(direction == "forward"){
            threading.Thread(target=self.footStep,args=[1,objInfoForB,false]).start()
            threading.Thread(target=self.footStep,args=[3,objInfoForA,true]).start()
            threading.Thread(target=self.footStep,args=[5,objInfoForA,false]).start()
            time.sleep(delayTime*2)
            threading.Thread(target=self.footStep,args=[2,objInfoForA,true]).start()
            threading.Thread(target=self.footStep,args=[4,objInfoForB,true]).start()
            threading.Thread(target=self.footStep,args=[6,objInfoForA,false]).start()
        }else if(direction == "backward"){
            threading.Thread(target=self.footStep,args=[1,objInfoForA,false]).start()
            threading.Thread(target=self.footStep,args=[3,objInfoForB,true]).start()
            threading.Thread(target=self.footStep,args=[5,objInfoForB,false]).start()
            time.sleep(delayTime*2)
            threading.Thread(target=self.footStep,args=[2,objInfoForB,true]).start()
            threading.Thread(target=self.footStep,args=[4,objInfoForA,true]).start()
            threading.Thread(target=self.footStep,args=[6,objInfoForB,false]).start()
        }
        print("ok")   
    }
    spiderHighControl(newHigh){
        var self = this
        var objInfo = self.highControl(newHigh)
        
        Motors[(1-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(false,0)))
        Motors[(3-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(true,0)))
        Motors[(5-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(false,0)))
        time.sleep(defaultTime)
        self.attribution(1,objInfo,true)
        self.attribution(3,objInfo,false)
        self.attribution(5,objInfo,true)
        time.sleep(defaultTime)
        Motors[(2-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(true,0)))
        Motors[(4-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(true,0)))
        Motors[(6-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(false,0)))
        time.sleep(defaultTime)
        self.attribution(2,objInfo,false)
        self.attribution(4,objInfo,false)
        self.attribution(6,objInfo,true)
    }

    footStep(footNum,objInfo,mirrorProperty){
        var self = this
        while(true){
            Motors[(footNum-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,0)))
            time.sleep(objInfo["delayTime"])
            Motors[(footNum-1)*3+2].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["step"]["Alfa"])))
            Motors[(footNum-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["step"]["Betta"])))    
            Motors[(footNum-1)*3].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["step"]["Gamma"])))
            time.sleep(objInfo["delayTime"])
            Motors[(footNum-1)*3+2].ChangeDutyCycle(self.degreeToPulse(90))
            Motors[(footNum-1)*3+1].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["zeroLevel"]["Betta"])))   
            Motors[(footNum-1)*3].ChangeDutyCycle(self.degreeToPulse(self.mirrorCheck(mirrorProperty,objInfo["zeroLevel"]["Gamma"])))
            time.sleep(objInfo["delayTime"])
            if(self.breakCall) break
        }
    }
    setMotorPWM(footNumber,partNumber,degree){
        this.Motors[footNumber][partNumber].servoWrite(this.degreeToPulse(degree))
    }
    moveFoot(index,degrees){
        this.setMotorPWM(index,1,degrees.Alfa)
        this.setMotorPWM(index,2,degrees.Betta)
        this.setMotorPWM(index,3,degrees.Gamma)
    }
    move(moveSteps){
        var self = this
        console.log(self.Motors)
        // while(true){
        //     this.moveFoot(1,moveSteps)
        // }
    }
    test(){
        console.log(this.yAxisStepControl(30))
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

var spider = new spiderMove(spiderCon)

spider.test()