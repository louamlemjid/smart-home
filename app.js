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
app.use(cors());
/*{
    origin: ['http://localhost:8081', 'https://smart-home-v418.onrender.com', 'http://localhost:1000'], // Correct origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
} */
// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
                const { device, user } = req.params;
                const { state, temperature, mode, duration, startTime, endTime } = req.body;
                
                let updateData = {
                    name: device,
                    state: state,
                };
        
                // Conditionally add fields based on device type
                if (device.startsWith('ac')) {
                    updateData.temperature = temperature;
                    updateData.mode = mode;
                } else if (device.startsWith('hv')) {
                    updateData.duration = duration;
                    updateData.startTime = startTime;
                    updateData.endTime = endTime;
                }
        
                const changeState = await User.findOneAndUpdate(
                    { name: user, 'devices.name': device },
                    { $set: { 'devices.$': updateData } },  // Update the matched device in the array
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