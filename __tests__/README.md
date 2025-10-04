# Testing Guide for @al-hamoud/authx

## Overview

This document provides comprehensive guidance on the testing strategy, setup, and execution for the authx library. Our testing approach ensures reliability, maintainability, and confidence in the authentication system.

## Testing Strategy

### Test Types

We implement a three-tier testing strategy:

1. **Unit Tests** (`__tests__/unit/`) - Test individual modules and functions in isolation
2. **Component Tests** (`__tests__/components/`) - Test React components with user interactions
3. **Integration Tests** (`__tests__/integration/`) - Test module interactions and API flows

### Coverage Goals

- **Statements**: 80%+ coverage of all executable code
- **Branches**: 70%+ coverage of conditional logic
- **Functions**: 90%+ coverage of all exported functions
- **Lines**: 80%+ coverage of source lines

## Test Setup

### Dependencies

The project uses Jest as the primary testing framework with these key dependencies:

```json
{
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.0", 
  "@testing-library/user-event": "^14.6.1",
  "@types/jest": "^30.0.0",
  "jest": "^30.2.0",
  "jest-environment-jsdom": "^30.2.0",
  "ts-jest": "^29.4.4"
}
```

### Configuration

- **Jest Config**: `jest.config.cjs` - CommonJS format for ES module compatibility
- **Setup File**: `jest.setup.cjs` - Global mocks and test environment setup
- **TypeScript**: Configured with ts-jest for TypeScript transformation

### Environment Variables

Test environment provides these mocked Firebase/Supabase variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
SUPABASE_URL=https://test.supabase.co
SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:components  # Component tests only
npm run test:integration # Integration tests only

# Watch mode for development
npm run test:watch
```

### Test Files

```
__tests__/
├── unit/
│   ├── jwks.test.ts        # JWKS URL and Google JWK set tests
│   ├── verify.test.ts      # Firebase ID token verification tests
│   └── types.test.ts       # TypeScript interface validation tests
├── components/
│   └── Authx.test.tsx      # React component rendering and interaction tests
└── integration/
    ├── handler.test.ts     # Next.js API route handler tests
    ├── client.test.ts      # Supabase admin client tests
    └── ensureUser.test.ts  # User creation/management tests
```

## Test Categories

### Unit Tests

**Purpose**: Verify individual module functionality in isolation

#### jwks.test.ts
- JWKS URL constant validation
- Google JWK set creation
- Function return type verification

#### verify.test.ts
- Firebase ID token verification
- JWT payload validation
- Error handling for invalid tokens
- Custom claims processing

#### types.test.ts
- TypeScript interface compliance
- Optional field handling
- Custom claim index signature validation

### Component Tests

**Purpose**: Test React component behavior and user interactions

#### Authx.test.tsx
- Default props rendering
- Theme and styling application
- Country selection functionality
- Form input validation
- Custom label support
- Visibility control testing
- Props interface validation

### Integration Tests

**Purpose**: Test module interactions and end-to-end flows

#### handler.test.ts
- Next.js Edge runtime compatibility
- Request/response handling
- Firebase token verification flow
- Supabase user management integration
- Error response formatting

#### client.test.ts
- Supabase admin client creation
- Server-side configuration
- Authentication settings

#### ensureUser.test.ts
- User lookup by phone/email
- User creation workflow
- Firebase-Supabase user mapping
- Role assignment and metadata

## Mocking Strategy

### Firebase Mocks

```typescript
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ options: {} })),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  RecaptchaVerifier: jest.fn(),
  signInWithPhoneNumber: jest.fn(),
}));
```

### JOSE Library Mocks

```typescript
jest.mock('jose', () => ({
  jwtVerify: jest.fn()
}));

jest.mock('jose/jwks/remote', () => ({
  createRemoteJWKSet: jest.fn(() => jest.fn())
}));
```

### Supabase Mocks

```typescript
const mockAdminClient = {
  auth: {
    admin: {
      listUsers: jest.fn(),
      createUser: jest.fn(),
      updateUserById: jest.fn()
    }
  }
};
```

## Best Practices

### Test Structure

1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the function or interaction
3. **Assert**: Verify expected outcomes

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Describe blocks: Use descriptive module/component names
- Test cases: Use "should" statements describing expected behavior

### Error Testing

Always test both success and failure scenarios:

```typescript
it('should handle verification errors', async () => {
  mockVerifyFunction.mockRejectedValue(new Error('Invalid token'));
  
  await expect(functionUnderTest()).rejects.toThrow('Invalid token');
});
```

### Async Testing

Use proper async/await patterns:

```typescript
it('should verify valid token', async () => {
  const result = await verifyFirebaseIdToken(validToken, projectId);
  expect(result).toEqual(expectedPayload);
});
```

## Debugging Tests

### Common Issues

1. **Module Import Errors**: Ensure proper mocking of ES modules
2. **Async Race Conditions**: Use `waitFor` for async operations
3. **Mock Reset**: Clear mocks between tests with `jest.clearAllMocks()`

### Debug Commands

```bash
# Run single test file
npx jest __tests__/unit/verify.test.ts

# Run with verbose output
npx jest --verbose

# Run with debug output
npx jest --detectOpenHandles
```

## Coverage Analysis

### Viewing Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# View in browser
open coverage/lcov-report/index.html
```

### Coverage Metrics

- **Lines**: Percentage of executable lines tested
- **Functions**: Percentage of functions called in tests
- **Branches**: Percentage of conditional branches tested
- **Statements**: Percentage of statements executed

## Continuous Integration

### Pre-commit Hooks

Consider adding pre-commit hooks to run tests:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

### CI Pipeline

Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Writing New Tests

### Adding Unit Tests

1. Create test file in `__tests__/unit/`
2. Mock external dependencies
3. Test public API surface
4. Include error scenarios

### Adding Component Tests

1. Create test file in `__tests__/components/`
2. Use React Testing Library utilities
3. Test user interactions
4. Verify accessibility

### Adding Integration Tests

1. Create test file in `__tests__/integration/`
2. Mock external services (Firebase, Supabase)
3. Test module interactions
4. Verify API contracts

## Maintenance

### Regular Tasks

- Update test dependencies monthly
- Review coverage reports for gaps
- Refactor tests when implementation changes
- Add tests for new features

### Performance

- Keep tests fast (< 100ms per test)
- Mock heavy dependencies
- Use setup/teardown for common operations
- Consider test parallelization for large suites

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/write-tests)
- [Firebase Testing Guide](https://firebase.google.com/docs/rules/unit-tests)

---

**Last Updated**: October 4, 2025
**Test Suite Version**: 1.0.0
**Coverage Target**: 80%+ statements, 70%+ branches
