import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { UsersTable } from '../components/users/UsersTable';
import { AddUserModal } from '../components/users/AddUserModal';
import { EditUserModal } from '../components/users/EditUserModal';
import { DeleteUserModal } from '../components/users/DeleteUserModal';
import { ViewUserModal } from '../components/users/ViewUserModal';
import { useUsers } from '../hooks/useUsers';
import { gymsApi } from '../lib/users-api';
import type { User } from '../types/auth';
import type { CreateUserData, UpdateUserData } from '../lib/users-api';

export function UsersPage() {
  const {
    users,
    loading,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword
  } = useUsers();

  const [gymOptions, setGymOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    delete: false,
    view: false,
    resetPassword: false
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUsers({ page: 1, limit: 50 }),
        loadGymOptions()
      ]);
    };
    
    loadData();
  }, []); // Empty dependency array for initial load only

  const loadGymOptions = async () => {
    try {
      const response = await gymsApi.getGyms();
      if (response.success) {
        setGymOptions(response.data.gyms.map(gym => ({
          value: gym._id,
          label: gym.name
        })));
      }
    } catch (error) {
      console.error('Failed to load gym options:', error);
    }
  };

  const handleAddUser = () => {
    setModals(prev => ({ ...prev, add: true }));
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModals(prev => ({ ...prev, edit: true }));
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setModals(prev => ({ ...prev, delete: true }));
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setModals(prev => ({ ...prev, view: true }));
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setModals(prev => ({ ...prev, resetPassword: true }));
  };

  const handleSearch = useCallback(async (filters: Record<string, any>) => {
    await fetchUsers({ ...filters, page: 1, limit: 50 });
  }, [fetchUsers]);

  const handlePageChange = useCallback(async (page: number) => {
    await fetchUsers({ page, limit: 50 });
  }, [fetchUsers]);

  const closeModals = () => {
    setModals({
      add: false,
      edit: false,
      delete: false,
      view: false,
      resetPassword: false
    });
    setSelectedUser(null);
  };

  const handleCreateUser = async (userData: CreateUserData) => {
    const success = await createUser(userData);
    if (success) {
      closeModals();
    }
  };

  const handleUpdateUser = async (userData: UpdateUserData) => {
    if (!selectedUser) return;
    const success = await updateUser(selectedUser._id, userData);
    if (success) {
      closeModals();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    const success = await deleteUser(selectedUser._id);
    if (success) {
      closeModals();
    }
  };

  const handleConfirmResetPassword = async (newPassword: string) => {
    if (!selectedUser) return;
    const success = await resetUserPassword(selectedUser._id, newPassword);
    if (success) {
      closeModals();
    }
  };

  return (
    <AppLayout>
      <UsersTable
        users={users}
        loading={loading}
        pagination={pagination}
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onViewUser={handleViewUser}
        onResetPassword={handleResetPassword}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        gymOptions={gymOptions}
      />

      <AddUserModal
        opened={modals.add}
        onClose={closeModals}
        onSubmit={handleCreateUser}
        gymOptions={gymOptions}
      />

      {selectedUser && (
        <>
          <EditUserModal
            opened={modals.edit}
            onClose={closeModals}
            onSubmit={handleUpdateUser}
            user={selectedUser}
            gymOptions={gymOptions}
          />

          <DeleteUserModal
            opened={modals.delete}
            onClose={closeModals}
            onConfirm={handleConfirmDelete}
            user={selectedUser}
          />

          <ViewUserModal
            opened={modals.view}
            onClose={closeModals}
            user={selectedUser}
          />
        </>
      )}
    </AppLayout>
  );
}
