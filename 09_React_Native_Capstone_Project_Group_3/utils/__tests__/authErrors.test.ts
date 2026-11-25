import { AxiosError, AxiosHeaders } from 'axios';
import { getAuthErrorMessage } from '../authErrors';

const FALLBACK = 'Login failed';

function axiosError(status?: number, data?: unknown, code?: string): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response =
    status === undefined
      ? undefined
      : { status, statusText: '', headers: {}, config, data };
  return new AxiosError('Request failed', code, config, undefined, response);
}

describe('getAuthErrorMessage', () => {
  it('explains wrong credentials in plain words', () => {
    expect(getAuthErrorMessage(axiosError(400, { message: 'Invalid credentials' }), FALLBACK)).toBe(
      'Incorrect username or password.'
    );
  });

  it('tells the user when there is no connection', () => {
    expect(getAuthErrorMessage(axiosError(), FALLBACK)).toMatch(/internet connection/);
  });

  it('tells the user when the request timed out', () => {
    expect(getAuthErrorMessage(axiosError(undefined, undefined, 'ECONNABORTED'), FALLBACK)).toMatch(/too long/);
  });

  it('hides server crashes behind a friendly message', () => {
    expect(getAuthErrorMessage(axiosError(503, { message: 'oops' }), FALLBACK)).toMatch(/having trouble/);
  });

  it('uses the server message for other errors', () => {
    expect(getAuthErrorMessage(axiosError(403, { message: 'Account locked' }), FALLBACK)).toBe('Account locked');
  });

  it('falls back when the server gives no message', () => {
    expect(getAuthErrorMessage(axiosError(404, {}), FALLBACK)).toBe(FALLBACK);
  });

  it('keeps the message of plain errors', () => {
    expect(getAuthErrorMessage(new Error('Invalid credentials'), FALLBACK)).toBe('Invalid credentials');
    expect(getAuthErrorMessage('weird', FALLBACK)).toBe(FALLBACK);
  });
});
