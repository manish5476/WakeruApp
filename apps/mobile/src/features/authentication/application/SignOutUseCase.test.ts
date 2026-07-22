import type { AuthRepository, SessionRepository } from '@tripsplit/domain';
import { SignOutUseCase } from '../application/SignOutUseCase';

describe('SignOutUseCase', () => {
  it('clears encrypted state even when remote sign-out fails', async () => {
    const sessionRepository: jest.Mocked<SessionRepository> = {
      clear: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue({
        tokens: { accessToken: 'access', refreshToken: 'refresh' },
        user: {
          displayName: 'Ada',
          email: 'ada@example.com',
          id: 'user-1' as never,
        },
      }),
      write: jest.fn(),
    };
    const authRepository: jest.Mocked<AuthRepository> = {
      refreshSession: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn().mockRejectedValue(new Error('offline')),
    };

    await expect(
      new SignOutUseCase(authRepository, sessionRepository).execute(),
    ).rejects.toThrow('offline');
    expect(sessionRepository.clear).toHaveBeenCalledTimes(1);
  });
});
