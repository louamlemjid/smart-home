const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose=require('mongoose');
const { name } = require('ejs');
const app = express();
const PORT = 1000;
const dotenv = require('dotenv');
dotenv.config();
const cron = require('node-cron');
const WebSocket = require('ws');
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });
const statistics=require('./services/statistics/getStatistics');
const {User,RemoteControl,Ac,Product} =require('./db');
let activeJobs = {};
let clients={}
const addNewAc = require('./controllers/crudAc/addNewAc');
const updateAc = require('./controllers/crudAc/updateAc');
const getAcNames=require('./controllers/crudAc/getAcNames')
const getAcRowData=require('./controllers/crudAc/getAcRowData');
const { error } = require('console');

// Helper function to convert minutes to cron syntax
function convertMinutesToCron(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${mins} ${hours} * * *`; // Cron syntax for minute and hour
}
const sensorReadingToDepth=(sensorReading,lowestReading=1,highestReading=337,maxAngle=100)=>{
    // Ensure the sensor reading is within the expected range (4 to 2500)
    console.log(highestReading,lowestReading);
  if (sensorReading < lowestReading ) {
    console.error('Sensor reading out of range');
    return 1; 
  }else if(sensorReading > highestReading){
    console.error('Sensor reading out of range');
    return 100; 
  }else{
// Calculate the angle based on the new sensor range
  const angle = ((sensorReading - lowestReading) / (highestReading - lowestReading)) * maxAngle;
  console.log(angle);
  return Math.round(angle*100)/100;
  }

  
  }
//hexadecial to signal converter
function hexToSignla(hex,startBurst=8700,space=4100,afterSpace=530,oneBurst=1560,zeroBurst=550,neutral=470){
    console.log(hex);
    let signalList=[startBurst,space,afterSpace];
    let binaryString = parseInt(hex,16).toString(2)
    console.log(binaryString);
    for (let i=0;i<binaryString.length;i++){
        if(binaryString[i]=='1'){
            signalList.push(oneBurst,neutral);
        }else{
            signalList.push(zeroBurst,neutral);
        }
    }
    return signalList;
}
// Helper function to update the state of the device in the database
async function updateDeviceState(user, device, newState) {
    try {
        await User.findOneAndUpdate(
            { name: user, 'devices.name': device },
            { $set: { 'devices.$.state': newState } },  // Update the matched device's state
            { new: true }
        );
        console.log(`Device ${device} turned ${newState}`);
    } catch (error) {
        console.error(`Failed to update device state: ${error}`);
    }
}
mongoose.connect(process.env.DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true });



// Middleware
app.use(cors(/*{
    origin: ['http://localhost:8081', 'https://smart-home-v418.onrender.com','http://192.168.1.104:8080'], // Allow your frontend and your deployed site
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Include PATCH if you're using it
    allowedHeaders: ['Content-Type','Access-Control-Allow-Origin','Authorization','Cache-Control']
}*/));
//routes
app.use('/statistics',statistics);
// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const db=mongoose.connection;
db.on('error',console.error.bind(console,'connection error:'));
db.once('open', async function(){
    console.log('connected to the database');
    try {
        server.on('upgrade', (req, socket, head) => {
            wss.handleUpgrade(req, socket, head, (ws) => {
              wss.emit('connection', ws, req);
            });
          });
        // let addedAc=await addNewAc('LG');
        // console.log(addedAc);
        // let updatedAc=await updateAc('LG','cool','auto','8808754',22);
        // console.log(updatedAc);
        // const newAc= await RemoteControl.insertMany({name:'LG',
            // cool:{
                // autoFan:{"16":"none","17":"none","18":"0x8808350","19":"0x8808451","20":"8808552","21":"8808653","22":"8808754","23":"8808855","24":"8808956","25":"8808A57","26":"8808B58","27":"8808C59","28":"8808D5A","29":"8808E5B","30":"8808F5C"}}
                // ,heat:{autoFan:{"low":"880B454","medium":"880B252","high":"880B050"}},fan:{"low":"880A30D","medium":"880A32F","high":"880A341"},dry:{autoFan:"8809856"}});
        // Routes
          
        // Create WebSocket server on port 8080
        
        // Set up an SSE route
        app.get('/events', (req, res) => {
            // Set the correct headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            
            // Send initial connection message
            // res.write(`data: {"test": "SSE connection established"}\n\n`);
            
            // Create the change stream
            const changeStream = User.watch([
              {
                $match: {
                  "operationType": "update",
                  "updateDescription.updatedFields.postedRowData": { $exists: true }
                }
              }
            ]);
            
            // Set up the event handler
            const changeHandler = (data) => {
              console.log('Change detected in SSE:', data);
              const { documentKey, updateDescription } = data;
              const userId = documentKey._id;
              const updatedRowData = updateDescription.updatedFields.postedRowData;
              console.log(typeof JSON.stringify(updatedRowData));
              
              // Send the data and flush
              res.write(`data: ${JSON.stringify(updatedRowData)}\n\n`);
            };
            
            // Register the handler
            changeStream.on('change', changeHandler);
            
            // Clean up when the connection is closed
            req.on('close', () => {
              console.log('SSE connection closed');
              // Remove the change handler and close the stream
              changeStream.removeListener('change', changeHandler);
              changeStream.close();
            });
          });

        app.patch('/:user/ac/microcontroller', async(req, res) => {
            try {
                const {user}=req.params;
                const {hexadecimalCode,signal}=req.body;
                console.log(user,signal);
                const postCode=await User.updateOne({name:user},
                    {$set:{postedHexadecimalCode:hexadecimalCode,
                        postedRowData:signal
                    }});
                console.log(postCode);
                res.status(200).send(postCode);
            } catch (error) {
                res.status(400).send(error);
            }
        });

        app.get('/products',async(req,res)=>{
            try {
                const products=await Product.find({});
                res.status(200).json({productsList:products});
            } catch (error) {
                console.error("products route failed: ",error);
                res.status(400).json({message:"failed to fetch products"});
            }
        })
        app.post('/products',async(req,res)=>{
            try {
                const {name,price,description}=req.body;
                const newProduct=await Product.insertMany({name,price,description});
                res.status(200).json({newProduct:newProduct});
            } catch (error) {
                console.error("products route failed: ",error);
                res.status(400).json({message:"failed to fetch products"});
            }
        })
        wss.on('connection', (ws,req) => {
            console.log('Client connected');
            const url = new URL(req.url, 'https://smart-home-v418.onrender.com/');
            // Get the value of userId from the query string
            const userId = url.searchParams.get('userId');
            console.log(userId);
            if(userId){
                clients[userId]=ws;
                console.log(clients);
            }
            // Receive message from the client
            ws.on('message', (message) => {
                console.log(`Received: ${message}`);
                // const data = JSON.parse(message);
                // console.log("data.type : ",data.type);
                // console.log("data : ",data);
                // ws.send(JSON.stringify({message:`Server received: ${message}`}));
                // You can broadcast a message to all connected clients
                // wss.clients.forEach((client) => {
                //     if (client.readyState === WebSocket.OPEN) {
                //         client.send(`Server received: ${message}`);
                //     }
                // });
            });
            Ac.watch().on('change', (data) => {
                console.log('Change detected:', data);
                if (data.operationType === 'update') {
                    const updatedAc = data.updateDescription.updatedFields;
                    console.log(updatedAc);
                    // ws.send(JSON.stringify(updatedAc));
                }else if(data.operationType === 'insert'){
                    const newAc = data.fullDocument;
                    console.log(newAc);
                    // ws.send(JSON.stringify(newAc));
                }
            });
            User.watch([
                {
                  $match: {
                    "operationType": "update",
                    // Match updates where only the waterLevel field in the devices array is updated
                    $expr: {
                      $anyElementTrue: {
                        $map: {
                          input: { $objectToArray: "$updateDescription.updatedFields" },
                          as: "field",
                          in: { $regexMatch: { input: "$$field.k", regex: /^devices\.\d+\.waterLevel$/ } }
                        }
                      }
                    }
                  }
                }
              ]).on('change', async(change) => {
                console.log("Change detected in waterLevel: ", change.updateDescription.updatedFields);
                const { documentKey, updateDescription } = change;
                const userId = documentKey._id.toHexString();
                console.log("userId: ",userId);
                const updatedWaterLevel = Object.values(updateDescription.updatedFields)[0]
                if(clients[userId]){
                    console.log("la longueur de l'objet est: ",Object.keys(clients).length);
                    let updatedDevices=await User.findOne({_id:userId});
                    clients[userId].send(JSON.stringify({"updatedWaterLevel":updatedWaterLevel,"updatedDevices":updatedDevices}));
                }
            });
                
              
            User.watch([
                {
                    $match: {
                        "operationType": "update",
                        "updateDescription.updatedFields.postedHexadecimalCode": { $exists: true }
                    }
                }
            ]).on('change', (data) => {
                console.log('Change detected:', data);
                    const { documentKey, updateDescription } =data;
                    const userId = documentKey._id;
                    const updatedHexCode = updateDescription.updatedFields.postedHexadecimalCode;
                    const waterLevel = updateDescription.updatedFields.waterLevel;
                    console.log("after update: ",userId,updatedHexCode)
                    // const updatedUser = updateDescription.updatedFields;
                    // console.log(updatedUser);
                    // ws.send(Object.values(updatedUser)[0])
                
            });
            // Handle disconnection
            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });
        app.post('/ac', async(req, res) => {
            try {
                const { acName,mode, fanSpeed, temperature, heatLevel, rowData,power } = req.body;
                console.log(acName,mode, fanSpeed, temperature, heatLevel, rowData,power);
                const updatedAc = await updateAc(acName, mode, fanSpeed, rowData, temperature, heatLevel,power);
                res.status(200).json({updatedAc:updatedAc});
                console.log(updatedAc);
            } catch (error) {
                res.status(400).json({error:error});
                console.log("error in patch /ac route: ",error)
            }
        });
        app.put('/ac', async(req, res) => {
            try {
                const {acName}=req.body
                console.log(acName)
                const addedAc=await addNewAc(acName);
                res.status(200).json({addedAc:addedAc});
            } catch (error) {
                res.status(400).json({error:error});
                console.log("error in post /ac route: ",error)
            }
        });
        app.get('/ac',async(req,res)=>{
            try {
                console.log("ac list is colled")
                let acNames=await getAcNames();
                console.log("list of ac names:",acNames)
                res.status(200).json({acList:acNames})
            } catch (error) {
                res.status(400).json({error:error});   
                console.log("error in get /ac route: ",error)
            }
        })
        
        app.post('/admin', async(req, res) => {
            const state=req.body.switch;
            console.log(state);
            // const chageState=await Device.updateOne({name:'led'},{$set:{state:state=="on"?true:false}});
            res.redirect('/admin');
        })
        app.get('/', async(req, res) => {
            try {
                // const acs=await RemoteControl.findOne({name:'LG'},{"cool.autoFan.24":1,_id:0});
                const acs=await Ac.findOne({name:'LG'});
                // console.log(hexToSignla(acs.cool.autoFan['24']));
                res.json(acs);
            } catch (error) {
                res.status(400).send(error);
                
            }
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
            const user =await User.insertMany({ name: req.body.name, devices: [] })
            res.status(200).send(user[0]);
            } catch (error) {
            res.status(400).send(error);
            }
        });
        app.get('/statistics', async (req, res) => {
            try {
              // Aggregate to get the total number of devices across all users
              const totalDevices = await User.aggregate([
                {
                  $group: {
                    _id: null,
                    totalDevices: { $sum: { $size: "$devices" } }
                  }
                }
              ]);
              const numberOfUsers = await User.countDocuments();
              // Extract totalDevices count from the result
              const totalDeviceCount = totalDevices[0]?.totalDevices || 0;
              console.log(totalDeviceCount);
              // Send the response
              res.status(200).json({ totalDevices: totalDeviceCount, numberOfUsers : numberOfUsers });
            } catch (error) {
              console.error("Error fetching statistics:", error);
              res.status(500).json({ message: "Error fetching statistics" });
            }
          });
        app.get('/:user',async(req,res)=>{
            try {
                const user=req.params.user;
            const userDevices=await User.findOne({name:user});
            console.log(userDevices);
            res.status(200).send(JSON.stringify({userId:userDevices._id}));
            } catch (error) {
                res.status(400).send(error);
            }
        })
        //create a device
        app.post('/:user/device', async (req, res) => {
            try {
              const userName = req.params.user;
              const deviceName = req.body.name;

              // Find the user
                const user = await User.findOne({ name: userName, devices: { $elemMatch: { name: deviceName } } });
                if(!user){
                    const addDevice = await User.updateOne({ name: userName },
                        { $push: { devices: { name: deviceName, state: false,waterLevel:0,switchOffTime:60,
                            startTime:{
                                hour:0,
                                minute:0
                            },
                            endTime:{
                                hour:23,
                                minute:0
                            } } } 
                        }
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
            const user = await User.findOneAndUpdate({ name: req.params.user },
                { $set: { 'devices.$[elem].lastUpdate': new Date() } },
                { arrayFilters: [{ 'elem.name': req.params.device }] }
            );
            
            if (!user) {
                return res.status(404).send('User not found');
            }
            const device = user.devices.find(d => d.name === req.params.device);
            res.send(device);
            } catch (error) {
            res.status(400).send(error);
            }
        });

        app.post('/ac/rowdata', async (req, res) => {
            try {
                console.log("getAcRowData route is called")
                const {acName,modeType,fanSpeed,temperature,powerState,heatLevel}=req.body;
                console.log(acName,modeType,fanSpeed,temperature,powerState,heatLevel);
                const rowData=await getAcRowData(acName,modeType,fanSpeed,temperature,powerState,heatLevel);
                console.log(rowData);
                const convertedData= rowData[0].split(',').map(Number);
                console.log("converted data: ",convertedData);
                res.status(200).json({rowData:convertedData});

            } catch (error) {
                console.error("error in getAcRowData: ",error);
                res.status(400).json({error:error});
            }
        })
        app.get('/hv/:user/:device', async (req, res) => {
            try {
            const user = await User.findOneAndUpdate({ name: req.params.user },
                { $set: { 'devices.$[elem].lastUpdate': new Date() } },
                { arrayFilters: [{ 'elem.name': req.params.device }] }
            );

            if (!user) {
                res.status(404).json({error:'User not found'});
            }
            const devices = user?.devices;
            console.log("devices hv route: ",devices);

            const device = devices.find(d => d.name === req.params.device);
            if (!device) {
                res.status(404).json({error:'Device not found'});
            }
            console.log("device hv route: ",device);

            const state = device?.state ? 'on' : 'off';
            var insideInterval = 'yes';
            if(device.endTime && device.startTime){
                const currentTime = new Date();
                
                const startTime = new Date(currentTime.getFullYear()
                ,currentTime.getMonth(),
                currentTime.getDate(),
                device.startTime?.hour || 0,
                device.startTime?.minute || 0);

                const endTime = new Date(
                    currentTime.getFullYear(),
                    currentTime.getMonth(),
                    currentTime.getDate(),
                    device.endTime?.hour || 22,
                    device.endTime?.minute || 0
                );
                if(device.endTime.hour*24+device.endTime.minute < device.startTime.hour*24 + device.startTime.minute){
                    endTime.setDate(endTime.getDate() + 1);
                    console.log("end time is set to next day");
                }
                if (currentTime >= startTime && currentTime <= endTime) {
                    insideInterval = 'yes';
                } else {    
                    insideInterval = 'no';
                }
            }
            if(device?.linkedWaterLevelDevice)
                {
                    const linkedDevice = devices.find(d => d.name === device.linkedWaterLevelDevice);
                    if (!linkedDevice) {
                        res.status(206).json({error:'Linked water level device not found',
                            state:state,
                            insideInterval: insideInterval
                        });
                    }
                    res.status(200).json({
                        state: state,
                        waterLevel: linkedDevice.waterLevel,
                        insideInterval: insideInterval,
                    })
                }
                else{
                    res.status(206).json({error:'Water level device not linked',
                        state:state,
                        insideInterval: insideInterval
                    });
                }
            } catch (error) {
            res.status(400).send(error);
            }

        })
        app.post('/:user/:device', async (req, res) => {
            try {
                const { device, user } = req.params;
                let { state, temperature,fanSpeed, mode, linkedWaterLevelDevice, startTime,switchOffTime ,
                    endTime, waterLevel,depth,tankLength,tankWidth,maxHeight,lastUpdate } = req.body;
                    console.log("remote devices data:",req.body);
                // waterLevel=sensorReadingToDepth(waterLevel);
                // let AmplifiedDuration=duration*2;
                // if(AmplifiedDuration==60){
                //     AmplifiedDuration=59;
                // }
                let updateData = {
                    name: device,
                    state: state,
                    lastUpdate:lastUpdate
                };
        
                // Conditionally add fields based on device type
                if (device.startsWith('ac')) {
                    updateData.temperature = temperature;
                    updateData.mode = mode;
                    updateData.fanSpeed = fanSpeed;
                    updateData.switchOffTime = switchOffTime;
                    const changeState = await User.findOneAndUpdate(
                    { name: user, 'devices.name': device },
                    { $set: { 'devices.$': updateData } },  // Update the matched device in the array
                    { new: true }
                );
                    console.log(changeState);
                    res.status(200).send(changeState);
                } else if (device.startsWith('hv')) {
                    if(linkedWaterLevelDevice){
                        updateData.linkedWaterLevelDevice = linkedWaterLevelDevice;
                    }
                   if(startTime && endTime ){
                        updateData.startTime = startTime;
                        updateData.endTime = endTime;
                        const configuration = await User.findOneAndUpdate(
                            { name: user, 'devices.name': device },
                            { $set: { 'devices.$': updateData } },  // Update the matched device in the array
                            { new: true }
                        );
                        console.log("update from app: ",configuration);
                        res.status(200).send(configuration);
                    }else{
                        const stateChange = await User.findOneAndUpdate(
                            { name: user, 'devices.name': device },
                            { $set: { 'devices.$.state': state,
                                'devices.$.lastUpdate':new Date()
                             } },  // Update the matched device in the array
                            { new: true }
                        );
                        console.log("update from device:",stateChange);
                        res.status(200).send(stateChange);
                    }
                } else if (device.startsWith('wl')) {
                    updateData.waterLevel = waterLevel
                    console.log("water level updated: ",waterLevel);
                    if(depth && maxHeight){
                        updateData.tankDepth=depth;
                    updateData.tankLength=tankLength;
                    updateData.tankWidth=tankWidth;
                    updateData.maxWaterLevel=maxHeight;
                    const changeState = await User.findOneAndUpdate(
                        { name: user, 'devices.name': device },
                        { $set: { 'devices.$': updateData } },
                        { new: true }
                    );
                        console.log(changeState);
                        res.status(200).send(changeState);
                    }else{
                        const changeState = await User.findOneAndUpdate(
                            { name: user, 'devices.name': device },
                            { $set: { 'devices.$.waterLevel': waterLevel,
                              'devices.$.lastUpdate':new Date() 
                             } },  // Update the matched device in the array
                            { new: true }
                        );
                            console.log(changeState);
                            res.status(200).send(changeState);
                    }

                    
                }else if(device.startsWith('led')){
                    const changeState = await User.findOneAndUpdate(
                        { name: user, 'devices.name': device },
                        { $set: { 'devices.$.state': state } },  // Update the matched device in the array
                        { new: true }
                    );
                    console.log(changeState);
                    res.status(200).send(changeState);
                }
        
                // Update the device in the user's list of devices
                // const changeState = await User.findOneAndUpdate(
                //     { name: user, 'devices.name': device },
                //     { $set: { 'devices.$': updateData } },  // Update the matched device in the array
                //     { new: true }
                // );

                // if (activeJobs[device]) {
                //     activeJobs[device].forEach(job => job.stop());
                // }

                // function sequence(duration){
                //     let ch=""
                //     for (let i=duration;i<60;i+=duration*2){
                //         ch+=`${i},`
                //     }
                //     console.log(ch.slice(0,-1));
                //     return ch.slice(0,-1);
                // }

                // if (startTime && endTime && duration) {
                //     // Convert startTime and endTime to Date objects if they're not already
                //     const start = new Date(startTime);
                //     const end = new Date(endTime);
        
                //     const xDuration = duration * 60 * 1000; // Convert duration from minutes to milliseconds
        
                //     // Schedule the initial ON job at startTime
                //     let onJob = cron.schedule(`${start.getMinutes()} ${start.getHours()} * * *`, async () => {
                //         console.log(`Device ${device} initial ON at start time.`);
                //         await updateDeviceState(user, device, true); // Turn device ON
        
                //         // Start setInterval to toggle the device ON and OFF for xDuration
                //         let toggleInterval = setInterval(async () => {
                //             await updateDeviceState(user, device, true); // Turn device ON
                //             console.log('Device turned ON');
        
                //             // Turn device OFF after xDuration
                //             setTimeout(async () => {
                //                 await updateDeviceState(user, device, false); // Turn device OFF
                //                 console.log('Device turned OFF');
                //             }, xDuration);
        
                //         }, xDuration * 2); // Run every xDuration * 2 (ON for xDuration, OFF for xDuration)
        
                //         // Store the interval for cleanup later
                //         activeJobs[device].push({ interval: toggleInterval });
        
                //     });
        
                //     // Schedule the final OFF job at endTime
                //     let offJob = cron.schedule(`${end.getMinutes()} ${end.getHours()} * * *`, async () => {
                //         console.log(`Device ${device} OFF at end time.`);
                        
                //         // Turn off device and clear interval
                //         await updateDeviceState(user, device, false); // Turn device OFF
                        
                //         // Clear the interval to stop toggling
                //         if (activeJobs[device]) {
                //             activeJobs[device].forEach(job => clearInterval(job.interval));
                //         }
                //     });
        
                //     // Store active cron jobs for the device
                //     activeJobs[device] = [{ cron: onJob }, { cron: offJob }];
                // }
        
                
        
            } catch (error) {
                console.error(error);
                res.status(400).send(error);
            }
        });
        
        

        
    } catch (error) {
        console.error(error);
    }
});


// Start the server
server.listen(process.env.PORT || PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
module.exports = app;