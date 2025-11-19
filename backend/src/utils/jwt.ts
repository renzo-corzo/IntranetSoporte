import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

export const signToken = (payload: object, expiresIn: string = '8h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
}; 