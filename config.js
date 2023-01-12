const env = process.env;

const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  listPerPage: env.LIST_PER_PAGE || 10,
  clickupToken: env.CLICKUP_TOKEN || 'pk_37643430_GU3FOZZUKJQANHCZXE6Y3VU5ONBDCBJL',
  webhook: {
    gchatDeployment: env.GCHAT_WEBHOOK_DEPLOYMENT || 'https://chat.googleapis.com/v1/spaces/AAAAzwy2gvw/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=d1dyFIhKkcLDHwNGBMyiuW_VzLiUGKK1ZSC4C-9tKlo%3D'
  },
};

module.exports = config;