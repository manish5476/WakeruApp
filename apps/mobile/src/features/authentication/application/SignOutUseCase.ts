import type { AuthRepository, SessionRepository } from '@tripsplit/domain';

export class SignOutUseCase {
  public constructor(
    private readonly authRepository: AuthRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  public async execute(): Promise<void> {
    const session = await this.sessionRepository.read();
    try {
      if (session !== null)
        await this.authRepository.signOut(session.tokens.refreshToken);
    } finally {
      await this.sessionRepository.clear();
    }
  }
}
