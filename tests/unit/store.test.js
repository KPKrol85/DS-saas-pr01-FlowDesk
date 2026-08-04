import { beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'flowdesk_state_v1';

const loadStore = async ({ clearStorage = true } = {}) => {
  vi.resetModules();
  if (clearStorage) window.localStorage.clear();
  return import('../../js/core/store.js');
};

describe('store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts from seeded demo data', async () => {
    const { store } = await loadStore();
    const state = store.getState();

    expect(state.schemaVersion).toBe(3);
    expect(state.clients.length).toBeGreaterThan(0);
    expect(state.projects.length).toBeGreaterThan(0);
    expect(state.events.length).toBeGreaterThan(0);
  });

  it('adds a client and persists the updated state', async () => {
    const { store } = await loadStore();

    const client = store.addClient({
      name: 'Test Client',
      email: 'client@example.com',
      phone: '+48 500 100 200',
      status: 'Aktywny',
      notes: 'Created by test'
    });

    expect(client.id).toMatch(/^client-/);
    expect(store.getState().clients).toContainEqual(expect.objectContaining({ name: 'Test Client' }));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).clients).toContainEqual(expect.objectContaining({ name: 'Test Client' }));
  });

  it('rejects invalid client writes', async () => {
    const { store } = await loadStore();
    const beforeCount = store.getState().clients.length;

    const client = store.addClient({
      name: '',
      email: 'broken',
      status: 'Aktywny'
    });

    expect(client).toBeNull();
    expect(store.getState().clients.length).toBe(beforeCount);
  });

  it('updates UI preferences', async () => {
    const { store } = await loadStore();

    store.setTheme('dark');
    store.setReducedMotion(true);

    expect(store.getState().ui).toEqual({ theme: 'dark', reducedMotion: true });
  });

  it('validates imported JSON without committing it to state', async () => {
    const { store } = await loadStore();
    const beforeCount = store.getState().clients.length;

    const result = store.actions.validateStateFromJson(
      JSON.stringify({
        clients: [{ id: 'c-preview', name: 'Preview Client', email: 'preview@flowdesk.test' }],
        projects: [],
        events: [],
        ui: { theme: 'dark' }
      })
    );

    expect(result.ok).toBe(true);
    expect(result.data.clients).toContainEqual(expect.objectContaining({ id: 'c-preview' }));
    expect(store.getState().clients.length).toBe(beforeCount);
  });

  it('normalizes corrupted stored state on startup', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        clients: [{ id: 'c-old', name: 'Client', email: 'client@test.pl' }],
        projects: [{ id: 'p-old', name: 'Job', clientId: 'missing-client', dueDate: 'not-a-date' }],
        events: [{ id: 'e-old', title: 'Event', date: 'not-a-date', clientId: 'missing-client', projectId: 'missing-project' }],
        ui: { theme: 'unknown', reducedMotion: true }
      })
    );

    const { store } = await loadStore({ clearStorage: false });
    const state = store.getState();

    expect(state.schemaVersion).toBe(3);
    expect(state.projects[0]).toMatchObject({ clientId: '', dueDate: '' });
    expect(state.events[0]).toMatchObject({ clientId: '', projectId: '', date: '' });
    expect(state.ui).toEqual({ theme: 'light', reducedMotion: true });
  });

  it('deletes a client and related projects', async () => {
    const { store } = await loadStore();

    store.deleteClient('c1');

    expect(store.getState().clients.some((client) => client.id === 'c1')).toBe(false);
    expect(store.getState().projects.some((project) => project.clientId === 'c1')).toBe(false);
    expect(store.getState().events.some((event) => event.clientId === 'c1')).toBe(false);
    expect(store.getState().events.some((event) => event.projectId === 'p1')).toBe(false);
  });

  it('archives and restores important records through facade helpers', async () => {
    const { store } = await loadStore();

    store.archiveClient('c1');
    store.archiveProject('p1');

    expect(store.getState().clients.find((client) => client.id === 'c1').archivedAt).not.toBe('');
    expect(store.getState().projects.find((project) => project.id === 'p1').archivedAt).not.toBe('');

    store.restoreArchivedClient('c1');
    store.restoreArchivedProject('p1');

    expect(store.getState().clients.find((client) => client.id === 'c1').archivedAt).toBe('');
    expect(store.getState().projects.find((project) => project.id === 'p1').archivedAt).toBe('');
  });

  it('clears event project references when deleting a project', async () => {
    const { store } = await loadStore();

    store.deleteProject('p2');

    expect(store.getState().projects.some((project) => project.id === 'p2')).toBe(false);
    expect(store.getState().events.some((event) => event.projectId === 'p2')).toBe(false);
  });

  it('does not report a validated action as saved when the local write fails', async () => {
    const { createFlowDeskStore } = await loadStore();
    const { createStatePersistence } = await import('../../js/core/persistence.js');
    const values = new Map();
    const storageAdapter = {
      get: (storageKey) => values.get(storageKey) ?? null,
      set: vi.fn((storageKey, value) => values.set(storageKey, value) && true),
      remove: (storageKey) => values.delete(storageKey)
    };
    const store = createFlowDeskStore({ persistence: createStatePersistence({ storageAdapter }) });

    const saved = store.actions.createClient({ name: 'Durable Client', email: 'durable@test.pl' });

    expect(saved.ok).toBe(true);
    expect(saved.data.name).toBe('Durable Client');

    storageAdapter.set.mockImplementation(() => false);
    const failed = store.actions.createClient({ name: 'Volatile Client', email: 'volatile@test.pl' });

    expect(failed.ok).toBe(false);
    expect(failed.error).toBe('storage-write-failed');
    expect(store.getState().clients.some((client) => client.name === 'Volatile Client')).toBe(true);

    const invalid = store.actions.createClient({ name: '', email: 'not-an-email' });

    expect(invalid.ok).toBe(false);
    expect(invalid.error).not.toBe('storage-write-failed');
  });
});
