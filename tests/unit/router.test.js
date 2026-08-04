import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('router', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    window.location.hash = '';
  });

  it('normalizes hash routes', async () => {
    const { parseRoute } = await import('../../js/core/router.js');

    window.location.hash = '#clients';
    expect(parseRoute()).toBe('/clients');

    window.location.hash = '#/settings';
    expect(parseRoute()).toBe('/settings');
  });

  it('redirects protected routes to login without a session', async () => {
    const { router } = await import('../../js/core/router.js');
    const onRoute = vi.fn();

    window.location.hash = '#/clients';
    const cleanup = router.init({ onRoute });

    expect(window.location.hash).toBe('#/login');
    expect(onRoute).not.toHaveBeenCalled();

    cleanup();
  });

  it('routes authenticated users to protected views', async () => {
    window.localStorage.setItem('flowdesk_session_v1', JSON.stringify({ email: 'demo@flowdesk.pl' }));
    const { router } = await import('../../js/core/router.js');
    const onRoute = vi.fn();

    window.location.hash = '#/dashboard';
    const cleanup = router.init({ onRoute });

    expect(onRoute).toHaveBeenCalledWith(expect.objectContaining({ path: '/dashboard', view: expect.any(Function) }));

    cleanup();
  });

  it('routes an unknown hash path to the not-found view', async () => {
    window.localStorage.setItem('flowdesk_session_v1', JSON.stringify({ email: 'demo@flowdesk.pl' }));
    const { router } = await import('../../js/core/router.js');
    const { renderNotFoundView } = await import('../../js/views/notFoundView.js');
    const onRoute = vi.fn();

    window.location.hash = '#/does-not-exist';
    const cleanup = router.init({ onRoute });

    expect(onRoute).toHaveBeenCalledWith(expect.objectContaining({ path: '/does-not-exist', view: renderNotFoundView }));

    cleanup();
  });

  it('routes authenticated users to dynamic detail views', async () => {
    window.localStorage.setItem('flowdesk_session_v1', JSON.stringify({ email: 'demo@flowdesk.pl' }));
    const { router } = await import('../../js/core/router.js');
    const onRoute = vi.fn();

    window.location.hash = '#/clients/c1';
    const cleanup = router.init({ onRoute });

    expect(onRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/clients/c1',
        activePath: '/clients',
        params: { id: 'c1' },
        view: expect.any(Function)
      })
    );

    cleanup();
  });
});
