import * as Keychain from 'react-native-keychain';
import { z } from 'zod';
import type { AuthSession, SessionRepository } from '@tripsplit/domain';

const SERVICE = 'com.tripsplit.session.v1';

const sessionSchema = z.object({
  tokens: z.object({
    accessToken: z.string().min(1),
    expiresAt: z.string().optional(),
    refreshToken: z.string().min(1),
  }),
  user: z.object({
    avatarUrl: z.string().url().optional(),
    displayName: z.string().min(1),
    email: z.string().email(),
    id: z.string().min(1),
  }),
});

export class EncryptedSessionRepository implements SessionRepository {
  public async read(): Promise<AuthSession | null> {
    const credentials = await Keychain.getGenericPassword({ service: SERVICE });
    if (credentials === false) return null;
    try {
      return sessionSchema.parse(
        JSON.parse(credentials.password),
      ) as AuthSession;
    } catch {
      await this.clear();
      return null;
    }
  }

  public async write(session: AuthSession): Promise<void> {
    await Keychain.setGenericPassword('session', JSON.stringify(session), {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      service: SERVICE,
    });
  }

  public async clear(): Promise<void> {
    await Keychain.resetGenericPassword({ service: SERVICE });
  }
}
