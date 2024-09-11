const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose=require('mongoose');
const { name } = require('ejs');
const app = express();
const PORT = 1000;

mongoose.connect('mongodb+srv://louam-lemjid:8hAgfKf2ZDauLxoj@cluster0.mjqmopn.mongodb.net/smartHome', { useNewUrlParser: true, useUnifiedTopology: true });

// Models
const userschema= new mongoose.Schema({
    name:String,
    devices:[
        {
            name:String,
            state:Boolean,
            temperature:Number,
            mode:String,
            startTime:Date,
            endTime:Date,
            duration:Number
        }
    ]
});
const User=mongoose.model('User',userschema);

// Middleware
app.set('view engine','ejs');
app.use(cors({
    origin: ['http://localhost:8081', 'https://smart-home-1.onrender.com/*/*'], // Allow multiple origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization','Access-Control-Allow-Origin']
  }));
  
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const db=mongoose.connection;
db.on('error',console.error.bind(console,'connection error:'));
db.once('open', async function(){
    console.log('connected to the database');
    try {
        // Routes
        app.post('/admin', async(req, res) => {
            const state=req.body.switch;
            console.log(state);
            // const chageState=await Device.updateOne({name:'led'},{$set:{state:state=="on"?true:false}});
            res.redirect('/admin');
        })
        app.get('/admin', async(req, res) => {
            // const devices = await Device.find({});
            console.log(devices);
            res.render('admin');
        })
        app.get('/:user/devices', async(req, res) => {
            try {
                const devices = await User.findOne({name:req.params.user});
                console.log(devices);
                if (!devices) {
                    return res.status(404).send('User not found');
                }
                res.json({ devices: devices.devices });
            } catch (error) {
                res.status(400).send(error);
            }
        });
        // Create a new user
        app.post('/user', async (req, res) => {
            try {
            const user =await User.insertMany({ name: req.body.name, devices: [] });
            res.status(200).send(user);
            } catch (error) {
            res.status(400).send(error);
            }
        });
        
        app.post('/:user/device', async (req, res) => {
            try {
              const userName = req.params.user;
              const deviceName = req.body.name;
          
              // Find the user
                const user = await User.findOne({ name: userName, devices: { $elemMatch: { name: deviceName } } });
                if(!user){
                    const addDevice = await User.updateOne({ name: userName },
                        { $push: { devices: { name: deviceName, state: false } } }
                    );
                    console.log(addDevice);
                    res.status(200).send(addDevice);
                }else{
                    res.status(400).send('Device already exists');
                }
            
            //   if (!user) {
            //     return res.status(404).send('User not found');
            //   }
          
            //   // Check if the device already exists
            //   const deviceExists = user.devices.some(device => device.name === deviceName);
          
            //   if (deviceExists) {
            //     return res.status(400).send('Device already exists');
            //   }
          
            //   // Add the new device
            //   user.devices.push({ name: deviceName, state: false });
            //   await user.save();
          
            //   res.status(200).send(user);
            } catch (error) {
              res.status(400).send(error);
            }
          });
          
          
        
        // Get JSON object for a device
        app.get('/:user/:device', async (req, res) => {
            try {
            const user = await User.findOne({ name: req.params.user });
            
            if (!user) {
                return res.status(404).send('User not found');
            }
            const device = user.devices.find(d => d.name === req.params.device);
            res.send(device);
            } catch (error) {
            res.status(400).send(error);
            }
        });
        app.patch('/:user/:device', async (req, res) => {
            try {
                console.log(req.body.temperature,req.body.mode)
                let updateData={}
                if(req.params.device.startsWith('ac')){
                    updateData=
                    {name:req.params.device,
                    state: req.body.state,
                    temperature: req.body.temperature, 
                    mode: req.body.mode}
                }else if(req.params.device.startsWith('hv')){
                    updateData = {
                        name:req.params.device,
                        state: req.body.state,
                        duration: req.body.duration, 
                        startTime: req.body.startTime, 
                        endTime: req.body.endTime ,
                    };
                }
                
        
                const changeState = await User.updateOne(
                    { name: req.params.user, 'devices.name': req.params.device },
                    { $set: { 'devices.$': updateData } }, // Update the entire device object with updateData
                    { new: true }
                );
        
                console.log(changeState);
                res.status(200).send(changeState);
            } catch (error) {
                console.error(error);
                res.status(400).send(error);
            }
        });
        

        app.get('/louam/ac10000', async(req, res) => {
            res.json({ ledState: true });
        });
    } catch (error) {
        console.error(error);
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});