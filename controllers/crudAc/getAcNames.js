const {Ac }= require("../../db");
async function getAcNames() {
    try {
        // Fetch only the 'name' field for each AC
        let acList=[]
        let acNames = await Ac.find({}, { name: 1, _id: 0 });
        acNames=acNames.map(ac => ac.name);
        console.log(acNames)
        acNames.forEach(ac => {
            acList.push({label:ac,value:ac})
        });
        
        return acList
    } catch (error) {
        console.error("Error fetching AC names:", error);
        throw error;
    }
}
module.exports = getAcNames;