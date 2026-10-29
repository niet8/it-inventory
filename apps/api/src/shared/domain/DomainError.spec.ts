import { describe, expect, it } from 'vitest';

import {
  BusinessRuleViolationError,
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from '#shared/domain/DomainError';

describe('DomainError hierarchy', () => {
  it('names each error after its class and keeps it a DomainError', () => {
    const errors = [
      new ValidationError('Name is required', 'name'),
      new NotFoundError('Device', 'd-1'),
      new ConflictError('Email already in use'),
      new BusinessRuleViolationError('Device is decommissioned'),
    ];

    expect(errors.map((e) => e.name)).toEqual([
      'ValidationError',
      'NotFoundError',
      'ConflictError',
      'BusinessRuleViolationError',
    ]);
    for (const error of errors) expect(error).toBeInstanceOf(DomainError);
  });

  it('builds a readable not-found message and keeps the invalid field', () => {
    expect(new NotFoundError('Employee', 'e-7').message).toBe('Employee e-7 not found');
    expect(new ValidationError('Too long', 'code').field).toBe('code');
  });
});
