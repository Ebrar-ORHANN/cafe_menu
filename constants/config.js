export const CONFIG = {
  ADMIN_EMAILS: (process.env.EXPO_PUBLIC_ADMIN_EMAILS || 'kumlucabelediye1@gmail.com')
    .split(',')
    .map(email => email.trim()),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.EXPO_PUBLIC_MAX_LOGIN_ATTEMPTS || '5'),
  BLOCK_DURATION: parseInt(process.env.EXPO_PUBLIC_BLOCK_DURATION || '300000')
};