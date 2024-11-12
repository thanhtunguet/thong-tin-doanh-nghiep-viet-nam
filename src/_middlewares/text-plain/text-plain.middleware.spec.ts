import { TextPlainMiddleware } from './text-plain.middleware';

describe('TextPlainMiddleware', () => {
  it('should be defined', () => {
    expect(new TextPlainMiddleware()).toBeDefined();
  });
});
