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
        let due_date = moment.unix(task.due_date) || false;
        let start_date = moment.unix(task.start_date) || false;
        let pointer = (task.parent) ? task.parent : false;
        console.log("====== DEBUGGGG!!!!! =====")
        console.log(`TASK == ${JSON.stringify(task)}`)
        console.log(`START DATE == ${task.due_date}`)
        console.log(`DUE DATE == ${task.start_date}`)
        console.log("====== DEBUGGGG!!!!! =====")
        while (pointer) {
            let parent = await axios({
                method: "GET",
                url: `https://api.clickup.com/api/v2/task/${pointer}`
            });
            parent = parent.data
            if (type == "start-date") {
                let parent_start_date = moment.unix(parent.start_date) || false;
                let duration = (parent_start_date) ? moment.duration(parent_start_date.diff(start_date)).asDays() : false;

                if (parent_start_date && parent_start_date < start_date && parent_start_date.unix() > 0) {
                    start_date = parent_start_date
                }
                if (duration && duration !== 0 && start_date && start_date.unix() > 0) {
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
                                    comment_text: '(BOT) Date changed because of start date change on https://app.clickup.com/t/' + task.id
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
                let parent_due_date = moment.unix(parent.due_date) || false;
                let duration = (parent_due_date) ? moment.duration(parent_due_date.diff(due_date)).asDays() : false;
                // cek parent_due_date & task due_date mana yang lebih tua
                if (parent_due_date && parent_due_date > due_date) {
                    due_date = parent_due_date
                }
                // cek apakah ada selisih durasi antara parent_due_date dan due_date
                if (duration && duration !== 0 && due_date && due_date.unix() > 0) {
                    // update custom field webhook process
                    let cf_updated = await axios({
                        method: "POST",
                        url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`,
                        data: {
                            "value": 1
                        }
                    });
                    // jika berhasil webhook process, maka update due date, comment, dan delete value custom field webhook process
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
                                    comment_text: '(BOT) Date changed because of end date change on https://app.clickup.com/t/' + task.id
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
            
            // let parent_start_date = moment.unix(parent.start_date) || false;
            // let parent_due_date = moment.unix(parent.due_date) || false;
            
            // if (parent_due_date && parent_due_date > due_date && parent_due_date.unix() > 0) {
            //     due_date = parent_due_date
            // }
            // if (parent_start_date && parent_start_date < start_date && parent_start_date.unix() > 0) {
            //     start_date = parent_start_date
            // }
            // // cek apakah ada selisih durasi antara parent_due_date dan due_date

            // // update custom field webhook process
            // let cf_updated = await axios({
            //     method: "POST",
            //     url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`,
            //     data: {
            //         "value": 1
            //     }
            // });
            // // jika berhasil webhook process, maka update due date, comment, dan delete value custom field webhook process
            // if (cf_updated) {
            //     let date_payload = {};
            //     if (due_date && due_date.unix() > 0) date_payload.due_date = due_date.unix();
            //     if (start_date && start_date.unix() > 0) date_payload.start_date = start_date.unix();
            //     let date_updated = await axios({
            //         method: "PUT",
            //         url: `https://api.clickup.com/api/v2/task/${pointer}`,
            //         data: date_payload
            //     });
            //     if (date_updated) {
            //         await axios({
            //             method: "POST",
            //             url: `https://api.clickup.com/api/v2/task/${pointer}/comment`,
            //             data: {
            //                 comment_text: '(BOT) Date changed because of date change on https://app.clickup.com/t/' + task.id
            //             }
            //         });
            //     }
            //     await axios({
            //         method: "DELETE",
            //         url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`
            //     });
            // }
            
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
