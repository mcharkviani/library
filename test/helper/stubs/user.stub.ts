import { UserEntity } from '../../../src/modules/users/entities';

export const userStubData: Partial<UserEntity> = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.test@gmail.com',
};

export const defaultPassword: string = 'Test123!';
export const newUniqueEmail: string = 'jane.doe@gmail.com';
