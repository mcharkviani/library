import * as bcryptjs from 'bcryptjs';

export const hashPassword = async (password: string): Promise<{ salt: string; hashedPassword: string }> => {
  const salt: string = await bcryptjs.genSalt();
  const hashedPassword: string = await bcryptjs.hash(password, salt);

  return {
    salt,
    hashedPassword,
  };
};

export const validatePassword = async (password: string, salt: string, passwordHash: string): Promise<boolean> => {
  const hash: string = await bcryptjs.hash(password, salt);

  return hash === passwordHash;
};
