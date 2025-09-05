'use client';

import { useState, useEffect } from 'react';
import { Stack } from '@mantine/core';
import { AppLayout } from '../../components/layout/AppLayout';
import { AdminOnly } from '../../components/auth/ProtectedRoute';
import { UsersTable } from '../../components/users/UsersTable';
import { AddUserModal } from '../../components/users/AddUserModal';
import { EditUserModal } from '../../components/users/EditUserModal';
import { DeleteUserModal } from '../../components/users/DeleteUserModal';
import { ResetPasswordModal } from '../../components/users/ResetPasswordModal';
import { ViewUserModal } from '../../components/users/ViewUserModal';
import { useUsers } from '../../hooks/useUsers';
import { User, CreateUserData, UpdateUserData, gymsApi } from '../../lib/users-api';

interface GymOption {
  value: string;
  label: string;
}

function UsersPageContent() {
  const { createUser, updateUser, deleteUser, resetUserPassword } = useUsers();
  const [gymOptions, setGymOptions] = useState<GymOption[]>([]);
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  // Selected user for modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Loading states
  const [modalLoading, setModalLoading] = useState(false);

  // Load gym options on component mount
  useEffect(() => {
    const loadGymOptions = async () => {
      try {
        const response = await gymsApi.getGyms();
        const options = response.data.gyms.map(gym => ({
          value: gym._id,
          label: gym.name
        }));
        setGymOptions(options);
      } catch (error) {
        console.error('Failed to load gyms:', error);
      }
    };

    loadGymOptions();
  }, []);

  // Modal handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setAddModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPasswordModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  // Form submission handlers
  const handleCreateUser = async (userData: CreateUserData): Promise<boolean> => {
    setModalLoading(true);
    const success = await createUser(userData);
    setModalLoading(false);
    
    // No need to refresh - optimistic loading handles this
    return success;
  };

  const handleUpdateUser = async (id: string, userData: UpdateUserData): Promise<boolean> => {
    setModalLoading(true);
    const success = await updateUser(id, userData);
    setModalLoading(false);
    
    // No need to refresh - optimistic loading handles this
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    setModalLoading(true);
    const success = await deleteUser(selectedUser._id);
    setModalLoading(false);
    
    if (success) {
      setDeleteModalOpen(false);
      setSelectedUser(null);
      // No need to refresh - optimistic loading handles this
    }
  };

  const handleConfirmResetPassword = async (newPassword: string): Promise<boolean> => {
    if (!selectedUser) return false;
    
    setModalLoading(true);
    const success = await resetUserPassword(selectedUser._id, newPassword);
    setModalLoading(false);
    
    return success;
  };

  const handleEditFromView = () => {
    setViewModalOpen(false);
    setEditModalOpen(true);
  };

  return (
    <AppLayout>
      <Stack gap="lg">
        <UsersTable
          onAddUser={handleAddUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
          onViewUser={handleViewUser}
          gymOptions={gymOptions}
        />

        {/* Add User Modal */}
        <AddUserModal
          opened={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleCreateUser}
          gymOptions={gymOptions}
          loading={modalLoading}
        />

        {/* Edit User Modal */}
        <EditUserModal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleUpdateUser}
          user={selectedUser}
          gymOptions={gymOptions}
          loading={modalLoading}
        />

        {/* Delete User Modal */}
        <DeleteUserModal
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          user={selectedUser}
          loading={modalLoading}
        />

        {/* Reset Password Modal */}
        <ResetPasswordModal
          opened={resetPasswordModalOpen}
          onClose={() => setResetPasswordModalOpen(false)}
          onConfirm={handleConfirmResetPassword}
          user={selectedUser}
          loading={modalLoading}
        />

        {/* View User Modal */}
        <ViewUserModal
          opened={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          onEdit={handleEditFromView}
          user={selectedUser}
        />
      </Stack>
    </AppLayout>
  );
}

export default function UsersPage() {
  return (
    <AdminOnly>
      <UsersPageContent />
    </AdminOnly>
  );
}