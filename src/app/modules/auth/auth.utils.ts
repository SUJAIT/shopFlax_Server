/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/modules/auth/auth.utils.ts
import jwt, { JwtPayload, Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { IJwtPayload } from './auth.interface';
import config from '../../config';

export const createToken = (
  payload: IJwtPayload,
  secret: Secret,
  expiresIn: SignOptions['expiresIn'],
  extra?: Pick<SignOptions, 'subject' | 'jwtid'>
): string => {
  const options: SignOptions = { expiresIn, ...extra };

  // issuer/audience সেট করবো কেবল তখনই যখন এগুলো non-empty string
  const iss = (config as any).jwt_issuer ?? (config as any).JWT_ISSUER;
  if (typeof iss === 'string' && iss.trim()) options.issuer = iss.trim();

  const aud = (config as any).jwt_audience ?? (config as any).JWT_AUDIENCE;
  if (typeof aud === 'string' && aud.trim()) options.audience = aud.trim();

  return jwt.sign(payload, secret, options);
};

export const verifyToken = (
  token: string,
  secret: Secret,
  opts?: VerifyOptions
): JwtPayload => {
  const options: VerifyOptions = { ...opts };

  const iss = (config as any).jwt_issuer ?? (config as any).JWT_ISSUER;
  if (typeof iss === 'string' && iss.trim()) (options as any).issuer = iss.trim();

  const aud = (config as any).jwt_audience ?? (config as any).JWT_AUDIENCE;
  if (typeof aud === 'string' && aud.trim()) (options as any).audience = aud.trim();

  return jwt.verify(token, secret, options) as JwtPayload;
};

// (optional) decode helper
export const decodeToken = (token: string): JwtPayload | null => {
  const decoded = jwt.decode(token);
  return typeof decoded === 'string' || !decoded ? null : (decoded as JwtPayload);
};
