export interface IPersona {
  _id?: string;
  userId: string;
  displayName: string;
  background?: string;
  avatar?: string;
  makeDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
