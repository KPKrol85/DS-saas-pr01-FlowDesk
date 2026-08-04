import { seedData } from '../data/seed.js';
import {
  addProjectCommentAction,
  archiveClientAction,
  archiveProjectAction,
  createClientAction,
  createEventAction,
  createProjectAction,
  deleteClientAction,
  deleteEventAction,
  deleteProjectAction,
  exportStateAction,
  resetDemoDataAction,
  restoreArchivedClientAction,
  restoreArchivedProjectAction,
  restoreStateAction,
  restoreStateFromJsonAction,
  toggleProjectTaskAction,
  updateClientAction,
  updateEventAction,
  updateProjectAction,
  updateUiPreferencesAction
} from './actions.js';
import { statePersistence } from './persistence.js';
import { createFlowDeskRepositories } from '../repositories/index.js';

export const createFlowDeskStore = ({ persistence = statePersistence } = {}) => {
  let state = persistence.save(persistence.load());
  const repositories = createFlowDeskRepositories({ adapter: persistence.repositoryAdapter });
  const listeners = new Set();

  const notify = () => {
    listeners.forEach((listener) => listener(state));
  };

  const createId = (prefix) => {
    if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  };

  // A validated action whose local write failed is not reported to views as saved.
  const commitActionResult = (result) => {
    if (!result.ok) return result;
    const { state: nextState, persisted } = persistence.repositoryAdapter.persistState(result.nextState);
    state = nextState;
    notify();
    return persisted ? { ok: true, data: result.data } : { ok: false, error: 'storage-write-failed', data: result.data };
  };

  const actionContext = { createId };

  const actions = {
    createClient(payload) {
      return commitActionResult(createClientAction(state, payload, actionContext));
    },
    updateClient(id, payload) {
      return commitActionResult(updateClientAction(state, id, payload));
    },
    archiveClient(id) {
      return commitActionResult(archiveClientAction(state, id, actionContext));
    },
    restoreArchivedClient(id) {
      return commitActionResult(restoreArchivedClientAction(state, id, actionContext));
    },
    deleteClient(id) {
      return commitActionResult(deleteClientAction(state, id));
    },
    createProject(payload) {
      return commitActionResult(createProjectAction(state, payload, actionContext));
    },
    updateProject(id, payload) {
      return commitActionResult(updateProjectAction(state, id, payload, actionContext));
    },
    archiveProject(id) {
      return commitActionResult(archiveProjectAction(state, id, actionContext));
    },
    restoreArchivedProject(id) {
      return commitActionResult(restoreArchivedProjectAction(state, id, actionContext));
    },
    toggleProjectTask(projectId, taskId) {
      return commitActionResult(toggleProjectTaskAction(state, projectId, taskId, actionContext));
    },
    addProjectComment(projectId, payload) {
      return commitActionResult(addProjectCommentAction(state, projectId, payload, actionContext));
    },
    deleteProject(id) {
      return commitActionResult(deleteProjectAction(state, id));
    },
    createEvent(payload) {
      return commitActionResult(createEventAction(state, payload, actionContext));
    },
    updateEvent(id, payload) {
      return commitActionResult(updateEventAction(state, id, payload));
    },
    deleteEvent(id) {
      return commitActionResult(deleteEventAction(state, id));
    },
    updateUiPreferences(payload) {
      return commitActionResult(updateUiPreferencesAction(state, payload));
    },
    resetDemoData() {
      return commitActionResult(resetDemoDataAction(seedData));
    },
    restoreState(rawState) {
      return commitActionResult(restoreStateAction(rawState, seedData));
    },
    restoreStateFromJson(jsonText) {
      return commitActionResult(restoreStateFromJsonAction(jsonText, seedData));
    },
    validateStateFromJson(jsonText) {
      return restoreStateFromJsonAction(jsonText, seedData);
    },
    exportState() {
      const result = exportStateAction(state);
      return { ok: true, data: result.data };
    }
  };

  const unwrapData = (result) => (result.ok ? result.data : null);

  return {
    actions,
    repositories,
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      return unwrapData(actions.resetDemoData());
    },
    export() {
      return actions.exportState().data;
    },
    restore(rawState) {
      return unwrapData(actions.restoreState(rawState));
    },
    restoreJson(jsonText) {
      return unwrapData(actions.restoreStateFromJson(jsonText));
    },
    setTheme(theme) {
      return unwrapData(actions.updateUiPreferences({ theme }));
    },
    setReducedMotion(value) {
      return unwrapData(actions.updateUiPreferences({ reducedMotion: value }));
    },
    addClient(payload) {
      return unwrapData(actions.createClient(payload));
    },
    updateClient(id, payload) {
      return unwrapData(actions.updateClient(id, payload));
    },
    archiveClient(id) {
      return unwrapData(actions.archiveClient(id));
    },
    restoreArchivedClient(id) {
      return unwrapData(actions.restoreArchivedClient(id));
    },
    deleteClient(id) {
      return unwrapData(actions.deleteClient(id));
    },
    addProject(payload) {
      return unwrapData(actions.createProject(payload));
    },
    updateProject(id, payload) {
      return unwrapData(actions.updateProject(id, payload));
    },
    archiveProject(id) {
      return unwrapData(actions.archiveProject(id));
    },
    restoreArchivedProject(id) {
      return unwrapData(actions.restoreArchivedProject(id));
    },
    toggleProjectTask(projectId, taskId) {
      return unwrapData(actions.toggleProjectTask(projectId, taskId));
    },
    addProjectComment(projectId, payload) {
      return unwrapData(actions.addProjectComment(projectId, payload));
    },
    deleteProject(id) {
      return unwrapData(actions.deleteProject(id));
    },
    addEvent(payload) {
      return unwrapData(actions.createEvent(payload));
    },
    updateEvent(id, payload) {
      return unwrapData(actions.updateEvent(id, payload));
    },
    deleteEvent(id) {
      return unwrapData(actions.deleteEvent(id));
    }
  };
};

export const store = createFlowDeskStore();
