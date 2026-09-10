import mongoose from 'mongoose';

export type MongoState = 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'uninitialized';

const STATES: Record<number, MongoState> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

export async function connectToDatabase(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
}

export function databaseState(): MongoState {
  return STATES[mongoose.connection.readyState] ?? 'uninitialized';
}
