const mongoose = require('mongoose');

// Models
const Smartxschema = new mongoose.Schema({
    websiteLink: String,
});
const Smartx = mongoose.model('Smartx', Smartxschema);
const Productschema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    category: String,
    image: String
});
const Product = mongoose.model('Product', Productschema);
const Acschema = new mongoose.Schema({
    name: String,
    on:Array,
    off:Array,
    modes: [
        {
            modeType:String,
            fanSettings:[
                {
                    fanSpeed:String,
                    hexadecimalCode:String,
                    rowData:Array,
                    codes:[
                        {
                            hexadecimalCode:String,
                            rowData:Array,
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
    email:String,
    postedHexadecimalCode:String,
    postedRowData:Array,
    devices:[
        {
            name:String,
            customName:String,
            acName:String,
            state:Boolean,
            temperature:Number,
            mode:String,
            fanSpeed:String,
            startTime:Date,
            endTime:Date,
            duration:Number,
            waterLevel:Number,
            tankLength:Number,
            tankWidth:Number,
            tankDepth:Number,
            maxWaterLevel:Number,
            minWaterLevel:Number,
            lastUpdate:Date,
            switchOffTime:Number,
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
module.exports={User,RemoteControl,Ac,Product};