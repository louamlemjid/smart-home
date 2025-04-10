const {Ac}=require('../../db');
async function getAcRowData(acName,modeType,fanSpeed,temperature,powerState=null,heatLevel=null) {
    try {
        let ac=await Ac.findOne({name:acName});
        if(!ac){
            return null;
        }
        if( powerState=="on"){
            return ac.on;
        }
        else if(powerState=="off"){
            return ac.off;
        }
        if (modeType === "fan") {
            return ac.modes.find(mode => mode.modeType === modeType)
            .fanSettings.find(fan => fan.fanSpeed === fanSpeed)
            .rowData;
        } else {
            return ac.modes.find(mode => mode.modeType === modeType)
            .fanSettings.find(fan => fan.fanSpeed === fanSpeed)
            .codes.find(code => code.temperature === temperature || code.heatLevel === heatLevel)
            .rowData;
        }
        

        
    } catch (error) {
        console.error('Error retrieving AC row data:', error.message);
        
    }

} 
module.exports = getAcRowData;