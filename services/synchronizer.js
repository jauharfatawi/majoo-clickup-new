const config = require('../config');
const asyncFilter = require('../utils/filterAsync');
const axios = require('axios');
const moment = require('moment');

axios.defaults.headers.common['Authorization'] = config.clickupToken;
axios.defaults.headers.post['Content-Type'] = 'application/json';

async function dateSync(task_id, type) {
    try {
        let pointer = task_id
        let task = await axios({
            method: "GET",
            url: `https://api.clickup.com/api/v2/task/${pointer}`
        });
        task = task.data;
        let due_date = moment.unix(task.due_date);
        let start_date = moment.unix(task.start_date);
        pointer = (task.parent) ? task.parent : false
        while (pointer) {
            let parent = await axios({
                method: "GET",
                url: `https://api.clickup.com/api/v2/task/${pointer}`
            });
            parent = parent.data
            if (type == "start-date") {
                if (parent.start_date && moment.unix(parent.start_date) < start_date) {
                    start_date = moment.unix(parent.start_date)
                }
                if (start_date) {
                    await axios({
                        method: "PUT",
                        url: `https://api.clickup.com/api/v2/task/${pointer}`,
                        data: {
                            "start_date": start_date.unix()
                        }
                    });
                }
            } else {
                if (parent.due_date && moment.unix(parent.due_date) > due_date) {
                    due_date = moment.unix(parent.due_date)
                }
                if (due_date) {
                    await axios({
                        method: "PUT",
                        url: `https://api.clickup.com/api/v2/task/${pointer}`,
                        data: {
                            "due_date": due_date.unix()
                        }
                    });
                }
            }
            pointer = parent.parent
        }

        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}

module.exports = {
    dateSync,
}
