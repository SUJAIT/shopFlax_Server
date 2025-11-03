import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join((process.cwd(), '.env')) });

const asNumber = (v?: string, fallback = 12) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;

export default {
  NODE_ENV: process.env.NODE_ENV || 'development',
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: asNumber(process.env.BCRYPT_SALT_ROUNDS, 12),
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  jwt_otp_secret: process.env.JWT_OTP_SECRET,

};

// ---------------------Exampels----------------------