import {
  WORKSPACE_PREPARATION_CONTRACT_V1,
  WorkspacePreparationError,
} from '../../features/onboarding/domain/entities/workspace-preparation.entity';

describe('Workspace Preparation domain contract', () => {
  it('freezes the Version 1 contract identity', () => {
    expect(WORKSPACE_PREPARATION_CONTRACT_V1).toBe('workspace_preparation_v1');
  });

  it('exposes safe typed errors without raw provider content', () => {
    const error = new WorkspacePreparationError(
      'workspace_preparation.stale_version',
      'errors.workspacePreparation.stale_version',
      true
    );
    expect(error).toMatchObject({
      code: 'workspace_preparation.stale_version',
      message: 'errors.workspacePreparation.stale_version',
      retryable: true,
    });
  });
});
