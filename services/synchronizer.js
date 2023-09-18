const axios = require('axios');
const moment = require('moment');

const config = require('../config');
const asyncFilter = require('../utils/filterAsync');
const mongo = require('./mongo');


const webhook_cf_id = "d9e9bae7-cb1d-4a75-bacb-900a5f2a131c"
const mandays_cf_id = "49bcb816-b264-430f-bf51-6cc390787234"
const feedback_stg_cf_id = "b04b9446-4f56-47cd-ada0-2e379268fe40"
const feedback_prod_cf_id = "ce85b095-d027-4215-a936-778387e0c2f0"
const epic_release_cf_id = "dccb4f61-d762-4403-b560-b452216e34d2"
const reviewer_cf_id = "68dfad2d-8ec7-4d52-a406-9e849f0cbe2b"
const pm_cf_id = "bfd922ae-695a-41c1-9af7-e55ea38b8252"
const theme_cf_id = "1aa8337-49a5-4ba8-986e-409b46049e4e"
const quarter_cf_id = "ecb1c819-265d-42bb-918b-bc73d7df93c6"

axios.defaults.headers.common['Authorization'] = config.clickupToken;
axios.defaults.headers.post['Content-Type'] = 'application/json';

async function dateSync(payload, type) {
    try {
        let task = payload;
        let due_date = moment.unix(task.due_date) || false;
        let start_date = moment.unix(task.start_date) || false;
        let pointer = (task.parent) ? task.parent : false;
        let duration = parseInt(moment.duration(due_date.diff(start_date)).asDays());

        // tambahkan fungsi hitung mandays ketika ada trigger ubah mandays
        // await axios({
        //     method: "POST",
        //     url: `https://api.clickup.com/api/v2/task/${task.id}/field/${mandays_cf_id}`,
        //     data: {
        //         "value": ( duration / 1000)
                
        //     }
        // });

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
                        // await axios({
                        //     method: "POST",
                        //     url: `https://api.clickup.com/api/v2/task/${pointer}/field/${mandays_cf_id}`,
                        //     data: {
                        //         "value": moment.duration(moment(date_updated.data.due_date)).diff(moment(date_updated.data.start_date)).asDays()
                        //     }
                        // });    
                        // await axios({
                        //     method: "POST",
                        //     url: `https://api.clickup.com/api/v2/task/${pointer}/comment`,
                        //     data: {
                        //         comment_text: '(BOT) Date changed because of date change on https://app.clickup.com/t/' + task.id
                        //     }
                        // });
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

// untuk menambahkan counter pada custom field COUNTER FEEDBACK STAGING saat perubahan status dari QA Test Staging ke Rejected by QA Staging
async function counterFeedbackStaging(payload) {
    try {
        let task = payload
        let counter = task.custom_fields[1].value ? task.custom_fields[1].value : 0;
        
        await axios({
            method: "POST",
            url: `https://api.clickup.com/api/v2/task/${task.id}/field/${feedback_stg_cf_id}`,
            data: {
                "value": parseInt(counter)+1
            }
        });
        
        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}

// untuk menambahkan counter pada custom field COUNTER FEEDBACK PROD saat perubahan status dari QA Test Prod ke Rejected by QA Prod
async function counterFeedbackProd(payload) {
    try {
        let task = payload
        let counter = task.custom_fields[2].value ? task.custom_fields[2].value : 0;
        
        await axios({
            method: "POST",
            url: `https://api.clickup.com/api/v2/task/${task.id}/field/${feedback_prod_cf_id}`,
            data: {
                "value": parseInt(counter)+1
            }
        });
        
        return 'OK'
    } catch (error) {
        console.log("====== Start Err ClickUp =====")
        console.log(error)
        console.log("====== End Err ClickUp =====")
    }
}


// untuk EPIC RELEASE, REVIEWER & PM ketika buat subtask
async function subtaskSync(payload) {
    try {
        let task = payload
        let epic_release = task.custom_fields[51].value ? task.custom_fields[51].value : false;
        let theme = task.custom_fields[57].value ? task.custom_fields[57].value : false;
        let reviewer = task.custom_fields[64].value ? task.custom_fields[64].value : false;
        let quarter = task.custom_fields[66].value ? task.custom_fields[66].value : false;
        let pm = task.custom_fields[71].value ? task.custom_fields[71].value : false;
        
        console.log(task.custom_fields[51])
        console.log(task.custom_fields[57])
        console.log(task.custom_fields[64])
        console.log(task.custom_fields[66])
        console.log(task.custom_fields[71])

        // console.log(epic_release)
        // console.log(theme)
        // console.log(reviewer)
        // console.log(quarter)
        // console.log(pm)
        
        
        
        // let pointer = (task.parent) ? task.parent : false;

        // let parent = await axios({
        //         method: "GET",
        //         url: `https://api.clickup.com/api/v2/task/${pointer}`
        // });
        // parent = parent.data
            
        // let parent_epic_release = parent.custom_fields[51].value ? parent.custom_fields[51].value : false;
        // let parent_theme = parent.custom_fields[57].value ? parent.custom_fields[57].value : false;
        // let parent_reviewer = parent.custom_fields[64].value ? parent.custom_fields[64].value : false;
        // let parent_quarter = parent.custom_fields[66].value ? parent.custom_fields[66].value : false;
        // let parent_pm = parent.custom_fields[71].value ? parent.custom_fields[71].value : false;
        
        // console.log(parent_epic_release)
        // console.log(parent_theme)
        // console.log(parent_reviewer[0].id)
        // console.log(parent_quarter)
        // console.log(parent_pm[0].id)
        
        //     if (parent_epic_release) {
        //             epic_release = parent_epic_release
                    
        //         await axios({
        //             method: "POST",
        //             url: `https://api.clickup.com/api/v2/task/${task.id}/field/${epic_release_cf_id}`,
        //             data: {
        //                 "value": epic_release
        //             }
        //         });
        //     }
        
        //     if (parent_reviewer) {
        //         reviewer = parent_reviewer[0].id

        //         await axios({
        //             method: "POST",
        //             url: `https://api.clickup.com/api/v2/task/${task.id}/field/${reviewer_cf_id}`,
        //             data: {
        //                 "value": {add: [reviewer]}
        //             }
        //         });
        //     }

        //     if (parent_pm) {
        //         pm = parent_pm[0].id
                
        //         await axios({
        //             method: "POST",
        //             url: `https://api.clickup.com/api/v2/task/${task.id}/field/${pm_cf_id}`,
        //             data: {
        //                 "value": {add: [pm]}
        //             }
        //         });
        //     }

        //     if (parent_theme) {
        //         theme = parent_theme
                
        //         await axios({
        //             method: "POST",
        //             url: `https://api.clickup.com/api/v2/task/${task.id}/field/${theme_cf_id}`,
        //             data: {
        //                 "value": theme
        //             }
        //         });
        //     }
        
        //     if (parent_quarter) {
        //         quarter = parent_quarter
                
        //         await axios({
        //             method: "POST",
        //                 url: `https://api.clickup.com/api/v2/task/${task.id}/field/${quarter_cf_id}`,
        //             data: {
        //                 "value": quarter
        //             }
        //         });
        //     }
        
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
    counterFeedbackStaging,
    counterFeedbackProd,
    subtaskSync
}
