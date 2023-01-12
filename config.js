const env = process.env;

const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  listPerPage: env.LIST_PER_PAGE || 10,
  clickupToken: env.CLICKUP_TOKEN || 'pk_37643430_GU3FOZZUKJQANHCZXE6Y3VU5ONBDCBJL',
  webhook: {
    gchat_deployment: env.GCHAT_WEBHOOK_DEPLOYMENT
  },
};

module.exports = config;