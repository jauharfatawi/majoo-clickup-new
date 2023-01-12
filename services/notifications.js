const config = require('../config');
const moment = require('moment')
const axios = require('axios')

const gChatDeployment = async (data) => {
    let text = `🔔 New deployment submitted at ${moment().format('YYYY-DD-MM hh:mm:ss')} with details: \n>- Deployment Name: ${data.name} \n>- Squad: ${data.squad.toUpperCase()} \n>- Estimated Deployment: ${moment(data.date.split(' ').join('+')).format('YYYY-DD-MM hh:mm:ss')} \n>- Deployment ETA: ${data.eta} hour(s)\n>- Downtime: ${data.downtime} \n>- PRD/HLA: ${data.docs} \n>- Impacted App Services: ${data.service}`
    axios({
        method: "POST",
        url: config.webhook.gchatDeployment,
        data: {
            text: text
        }
    });

    return 'OK'
};

module.exports = {
    gChatDeployment
}
