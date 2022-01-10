import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(saltOrRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

export const hashPasswordSync = (password: string): string => {
  const salt = bcrypt.genSaltSync(saltOrRounds);
  return bcrypt.hashSync(password, salt);
};

export const matchHashedPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
