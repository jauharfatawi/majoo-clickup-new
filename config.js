const env = process.env;

const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    listPerPage: env.LIST_PER_PAGE || 10,
    clickupToken: env.CLICKUP_TOKEN,
    webhook: {
        gchatDeployment: env.GCHAT_WEBHOOK_DEPLOYMENT
    },
};

module.exports = config;