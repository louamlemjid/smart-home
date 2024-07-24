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
            state:Boolean
        }
    ]
});
const User=mongoose.model('User',userschema);

// Middleware
app.set('view engine','ejs');
app.use(cors({
    origin: ['http://localhost:8081', 'https://smart-home-1.onrender.com/'], // Allow multiple origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
        app.get('/', async(req, res) => {
            const devices = await Device.find({});
            console.log(devices);
            res.json({ ledState: devices[0].state });
        });
        // Create a new user
        app.post('/user', async (req, res) => {
            try {
            const user =await User.insertMany({ name: req.body.name, devices: [] });
            res.status(201).send(user);
            } catch (error) {
            res.status(400).send(error);
            }
        });
        
        // Create a new device for a user
        app.post('/:user/device', async (req, res) => {
            try {
            const device = await User.updateOne({ name: req.params.user },
                {$push:{devices:{name:req.body.name,state:false}}});
                console.log(device);
            res.status(201).send(device);
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
            const changeState=await User.updateOne({name:req.params.user,'devices.name':req.params.device},
                {$set:{'devices.$.state':req.body.state}},{new:true});
            res.send(changeState);
            } catch (error) {
                console.error(error);
                res.status(400).send(error);
            }
        })

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