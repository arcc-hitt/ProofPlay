// Description: Validating and loading environment variables using the `envalid` package.
// It ensures that all required environment variables are present and correctly formatted before the application starts.
import 'dotenv/config';  
import { cleanEnv, str, port, url } from 'envalid';

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production'], default: 'development' }),
  PORT: port({ default: 4000 }),
  MONGO_URI: url(),
  JWT_SECRET: str(),
  BACKEND_URL: url(),
  FRONTEND_URL: url(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  GITHUB_CLIENT_ID: str(),
  GITHUB_CLIENT_SECRET: str(),
});

export default env;
