const mongoose = require('mongoose');
// Models
const Acschema = new mongoose.Schema({
    name: String,
    modes: [
        {
            modeType:String,
            fanSettings:[
                {
                    fanSpeed:String,
                    hexadecimalCode:String,
                    codes:[
                        {
                            hexadecimalCode:String,
                            temperature:Number,
                            heatLevel:Number
                        }
                    ]
                }
            ]

            
        }
    ]
});
const Ac = mongoose.model('Ac', Acschema);
const userschema= new mongoose.Schema({
    name:String,
    postedHexadecimalCode:String,
    devices:[
        {
            name:String,
            state:Boolean,
            temperature:Number,
            mode:String,
            startTime:Date,
            endTime:Date,
            duration:Number,
            waterLevel:Number
        }
    ]
});
const User=mongoose.model('User',userschema);

const remoteControlschema= new mongoose.Schema({
    name:String,
    cool:{
       autoFan:{
        "16":String,
        "17":String,
        "18":String,
        "19":String,
        "20":String,
        "21":String,
        "22":String,
        "23":String,
        "24":String,
        "25":String,
        "26":String,
        "27":String,
        "28":String,
        "29":String,
        "30":String
       }
    },
    heat:{
        autoFan:{
            "low":String,
            "medium":String,
            "high":String
        }

    },
    fan:{
        "low":String,
        "medium":String,
        "high":String
    },
    dry:{
        autoFan:String
    },
});
const RemoteControl=mongoose.model('RemoteControl',remoteControlschema);
module.exports={User,RemoteControl,Ac};