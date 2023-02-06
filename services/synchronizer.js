const config = require('../config');
const asyncFilter = require('../utils/filterAsync');
const axios = require('axios');
const moment = require('moment');
const webhook_cf_id = "d9e9bae7-cb1d-4a75-bacb-900a5f2a131c"

axios.defaults.headers.common['Authorization'] = config.clickupToken;
axios.defaults.headers.post['Content-Type'] = 'application/json';

async function dateSync(payload, type) {
    try {
        let task = payload;
        let due_date = moment.unix(task.due_date);
        let start_date = moment.unix(task.start_date);
        let pointer = (task.parent) ? task.parent : false
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
                    let cf_updated = await axios({
                        method: "POST",
                        url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`,
                        data: {
                            "value": 1
                        }
                    });
                    if (cf_updated) {
                        let date_updated = await axios({
                            method: "PUT",
                            url: `https://api.clickup.com/api/v2/task/${pointer}`,
                            data: {
                                "start_date": start_date.unix()
                            }
                        });
                        if (date_updated) {
                            await axios({
                                method: "POST",
                                url: `https://api.clickup.com/api/v2/task/${pointer}/comment`,
                                data: {
                                    comment_text: '(PM BOT) Date changed because of start date change on https://app.clickup.com/t/' + task.id
                                }
                            });
                        }
                        await axios({
                            method: "DELETE",
                            url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`
                        });
                    }
                }
            } else {
                if (parent.due_date && moment.unix(parent.due_date) > due_date) {
                    due_date = moment.unix(parent.due_date)
                }
                if (due_date) {
                    let cf_updated = await axios({
                        method: "POST",
                        url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`,
                        data: {
                            "value": 1
                        }
                    });
                    if (cf_updated) {
                        let date_updated = await axios({
                            method: "PUT",
                            url: `https://api.clickup.com/api/v2/task/${pointer}`,
                            data: {
                                "due_date": due_date.unix()
                            }
                        });
                        if (date_updated) {
                            await axios({
                                method: "POST",
                                url: `https://api.clickup.com/api/v2/task/${pointer}/comment`,
                                data: {
                                    comment_text: '(PM BOT) Date changed because of end date change on https://app.clickup.com/t/' + task.id
                                }
                            });
                        }
                        await axios({
                            method: "DELETE",
                            url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`
                        });
                    }
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
