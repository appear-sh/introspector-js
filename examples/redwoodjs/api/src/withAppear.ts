import { createLambdaMiddleware } from '@appear.sh/introspector'

export const withAppear = createLambdaMiddleware({
  apiKey: 'your-api-key',
  environment: process.env.NODE_ENV,
})
