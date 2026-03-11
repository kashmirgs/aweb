import { create } from 'zustand';
import type { Group, CreateGroupRequest, UpdateGroupRequest, GroupMember } from '../types/permission';
import { adminApi } from '../api';

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  members: GroupMember[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchGroups: () => Promise<void>;
  fetchGroup: (id: number) => Promise<Group | null>;
  createGroup: (data: CreateGroupRequest) => Promise<Group | null>;
  updateGroup: (id: number, data: UpdateGroupRequest) => Promise<Group | null>;
  deleteGroup: (id: number) => Promise<boolean>;
  fetchMembers: (groupId: number) => Promise<void>;
  addMember: (groupId: number, userId: number) => Promise<boolean>;
  removeMember: (groupId: number, userId: number) => Promise<boolean>;
  clearError: () => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  currentGroup: null,
  members: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const groups = await adminApi.getAllGroups();
      set({ groups, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gruplar yüklenemedi';
      set({ error: message, isLoading: false });
    }
  },

  fetchGroup: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const group = await adminApi.getGroup(id);
      set({ currentGroup: group, isLoading: false });
      return group;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Grup yüklenemedi';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  createGroup: async (data: CreateGroupRequest) => {
    set({ isSaving: true, error: null });
    try {
      const group = await adminApi.createGroup(data);
      set((state) => ({
        groups: [...state.groups, group],
        isSaving: false,
      }));
      return group;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Grup oluşturulamadı';
      set({ error: message, isSaving: false });
      return null;
    }
  },

  updateGroup: async (id: number, data: UpdateGroupRequest) => {
    set({ isSaving: true, error: null });
    try {
      const group = await adminApi.updateGroup(id, data);
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? group : g)),
        currentGroup: state.currentGroup?.id === id ? group : state.currentGroup,
        isSaving: false,
      }));
      return group;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Grup güncellenemedi';
      set({ error: message, isSaving: false });
      return null;
    }
  },

  deleteGroup: async (id: number) => {
    set({ isSaving: true, error: null });
    try {
      await adminApi.deleteGroup(id);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        currentGroup: state.currentGroup?.id === id ? null : state.currentGroup,
        isSaving: false,
      }));
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Grup silinemedi';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  fetchMembers: async (groupId: number) => {
    set({ isLoading: true, error: null });
    try {
      const members = await adminApi.getGroupMembers(groupId);
      set({ members, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Üyeler yüklenemedi';
      set({ error: message, isLoading: false });
    }
  },

  addMember: async (groupId: number, userId: number) => {
    set({ isSaving: true, error: null });
    try {
      await adminApi.addGroupMember(groupId, userId);
      const members = await adminApi.getGroupMembers(groupId);
      set({ members, isSaving: false });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Üye eklenemedi';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  removeMember: async (groupId: number, userId: number) => {
    set({ isSaving: true, error: null });
    try {
      await adminApi.removeGroupMember(groupId, userId);
      set((state) => ({
        members: state.members.filter((m) => m.id !== userId),
        isSaving: false,
      }));
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Üye çıkarılamadı';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useGroupStore;
