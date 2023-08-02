  const axios = require('axios');
const moment = require('moment');

const config = require('../config');
const asyncFilter = require('../utils/filterAsync');
const mongo = require('./mongo');


const webhook_cf_id = "d9e9bae7-cb1d-4a75-bacb-900a5f2a131c"
const mandays_cf_id = "49bcb816-b264-430f-bf51-6cc390787234"
const feedback_cf_id = "b04b9446-4f56-47cd-ada0-2e379268fe40"

axios.defaults.headers.common['Authorization'] = config.clickupToken;
axios.defaults.headers.post['Content-Type'] = 'application/json';

async function dateSync(payload, type) {
    try {
        let task = payload;
        let due_date = moment.unix(task.due_date) || false;
        let start_date = moment.unix(task.start_date) || false;
        let pointer = (task.parent) ? task.parent : false;

        // tambahkan fungsi hitung mandays ketika ada trigger ubah mandays
        await axios({
            method: "POST",
            url: `https://api.clickup.com/api/v2/task/${task.id}/field/${mandays_cf_id}`,
            data: {
                "value": (moment.duration(due_date.diff(start_date)).asDays() / 1000)

            }
        });

        while (pointer) {
            let parent = await axios({
                method: "GET",
                url: `https://api.clickup.com/api/v2/task/${pointer}`
            });
            parent = parent.data

            let parent_start_date = moment.unix(parent.start_date) || false;
            let parent_due_date = moment.unix(parent.due_date) || false;

            let duration_start_date = (parent_start_date) ? moment.duration(parent_start_date.diff(start_date)).asDays() : false;
            let duration_due_date = (parent_due_date) ? moment.duration(parent_due_date.diff(due_date)).asDays() : false;

            if (parent_due_date && parent_due_date > due_date && parent_due_date.unix() > 0) {
                due_date = parent_due_date
            }
            if (parent_start_date && parent_start_date < start_date && parent_start_date.unix() > 0) {
                start_date = parent_start_date
            }

            let cf_updated = await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`,
                data: {
                    "value": 1
                }
            });

            if (cf_updated) {
                let date_payload = {};
                if (due_date && due_date.unix() > 0 && duration_due_date && duration_due_date !== 0) date_payload.due_date = due_date.unix();
                if (start_date && start_date.unix() > 0 && duration_start_date && duration_start_date !== 0) date_payload.start_date = start_date.unix();
                if (date_payload.due_date || date_payload.start_date) {
                    let date_updated = await axios({
                        method: "PUT",
                        url: `https://api.clickup.com/api/v2/task/${pointer}`,
                        data: date_payload
                    });
                    // if (date_updated) {
                    //     await axios({
                    //         method: "POST",
                    //         url: `https://api.clickup.com/api/v2/task/${pointer}/comment`,
                    //         data: {
                    //             comment_text: '(BOT) Date changed because of date change on https://app.clickup.com/t/' + task.id
                    //         }
                    //     });
                    // }
                    await axios({
                        method: "DELETE",
                        url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`
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

async function relationSync(payload) {
    // if (config.debug) mongo.insertLogs(payload);
    let ideation_field_id = "4f9363bd-08fd-4f20-8cd9-814bb96453fc"
    try {
        let task = payload;
        let due_date = moment.unix(task.due_date) || false;
        let start_date = moment.unix(task.start_date) || false;

        let custom_fields = task.custom_fields;
        let pointers = await asyncFilter(custom_fields, async (i) => {
            return i.id == ideation_field_id;
        });

        if (typeof pointers.value == 'undefined') return 'OK';

        for (let pointer of pointers.value) {
            let parent = await axios({
                method: "GET",
                url: `https://api.clickup.com/api/v2/task/${pointer.id}`
            });
            parent = parent.data

            let parent_start_date = moment.unix(parent.start_date) || false;
            let parent_due_date = moment.unix(parent.due_date) || false;

            let duration_start_date = (parent_start_date) ? moment.duration(parent_start_date.diff(start_date)).asDays() : false;
            let duration_due_date = (parent_due_date) ? moment.duration(parent_due_date.diff(due_date)).asDays() : false;

            if (parent_due_date && parent_due_date > due_date && parent_due_date.unix() > 0) {
                due_date = parent_due_date
            }
            if (parent_start_date && parent_start_date < start_date && parent_start_date.unix() > 0) {
                start_date = parent_start_date
            }

            let cf_updated = await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`,
                data: {
                    "value": 1
                }
            });

            if (cf_updated) {
                let date_payload = {};
                if (due_date && due_date.unix() > 0 && duration_due_date && duration_due_date !== 0) date_payload.due_date = due_date.unix();
                if (start_date && start_date.unix() > 0 && duration_start_date && duration_start_date !== 0) date_payload.start_date = start_date.unix();
                if (date_payload.due_date || date_payload.start_date) {
                    let date_updated = await axios({
                        method: "PUT",
                        url: `https://api.clickup.com/api/v2/task/${pointer}`,
                        data: date_payload
                    });
                    // if (date_updated) {
                    //     await axios({
                    //         method: "POST",
                    //         url: `https://api.clickup.com/api/v2/task/${pointer}/comment`,
                    //         data: {
                    //             comment_text: '(BOT) Date changed because of date change on https://app.clickup.com/t/' + task.id
                    //         }
                    //     });
                    // }
                    await axios({
                        method: "DELETE",
                        url: `https://api.clickup.com/api/v2/task/${pointer}/field/${webhook_cf_id}`
                    });
                }
            }
        }

        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}

// untuk menambahkan counter pada custom field FEEDBACK LOOP COUNTER saat perubahan status dari QA Test ke Rejected by QA
async function counterFeedback(payload) {
    try {
        let task = payload
        let counter = task.custom_fields[1].value;
            await axios({
                method: "POST",
                url: `https://api.clickup.com/api/v2/task/${task.id}/field/${feedback_cf_id}`,
                data: {
                    "value": counter+1
                }
            });

        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}

module.exports = {
    dateSync,
    relationSync,
    counterFeedback
}
