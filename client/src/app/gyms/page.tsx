'use client';

import { useState, useEffect } from 'react';
import { Stack } from '@mantine/core';
import { AppLayout } from '../../components/layout/AppLayout';
import { GymOwnerOnly } from '../../components/auth/ProtectedRoute';
import { GymsTable } from '../../components/gyms/GymsTable';
import { AddGymModal } from '../../components/gyms/AddGymModal';
import { EditGymModal } from '../../components/gyms/EditGymModal';
import { DeleteGymModal } from '../../components/gyms/DeleteGymModal';
import { ViewGymModal } from '../../components/gyms/ViewGymModal';
import { useGyms } from '../../hooks/useGyms';
import { Gym, CreateGymData, UpdateGymData } from '../../lib/gyms-api';

function GymsPageContent() {
  const { createGym, updateGym, deleteGym, gymOwners, fetchGymOwners } = useGyms();
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  // Selected gym for modals
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  
  // Loading states
  const [modalLoading, setModalLoading] = useState(false);

  // Load gym owners on component mount
  useEffect(() => {
    fetchGymOwners();
  }, [fetchGymOwners]);

  // Modal handlers
  const handleAddGym = () => {
    setSelectedGym(null);
    setAddModalOpen(true);
  };

  const handleEditGym = (gym: Gym) => {
    setSelectedGym(gym);
    setEditModalOpen(true);
  };

  const handleDeleteGym = (gym: Gym) => {
    setSelectedGym(gym);
    setDeleteModalOpen(true);
  };

  const handleViewGym = (gym: Gym) => {
    setSelectedGym(gym);
    setViewModalOpen(true);
  };

  // Form submission handlers
  const handleCreateGym = async (gymData: CreateGymData): Promise<boolean> => {
    setModalLoading(true);
    const success = await createGym(gymData);
    setModalLoading(false);
    
    // No need to refresh - optimistic loading handles this
    return success;
  };

  const handleUpdateGym = async (id: string, gymData: UpdateGymData): Promise<boolean> => {
    setModalLoading(true);
    const success = await updateGym(id, gymData);
    setModalLoading(false);
    
    // No need to refresh - optimistic loading handles this
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!selectedGym) return;
    
    setModalLoading(true);
    const success = await deleteGym(selectedGym._id);
    setModalLoading(false);
    
    if (success) {
      setDeleteModalOpen(false);
      setSelectedGym(null);
      // No need to refresh - optimistic loading handles this
    }
  };

  const handleEditFromView = () => {
    setViewModalOpen(false);
    setEditModalOpen(true);
  };

  return (
    <AppLayout>
      <Stack gap="lg">
        <GymsTable
          onAddGym={handleAddGym}
          onEditGym={handleEditGym}
          onDeleteGym={handleDeleteGym}
          onViewGym={handleViewGym}
        />

        {/* Add Gym Modal */}
        <AddGymModal
          opened={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleCreateGym}
          gymOwners={gymOwners}
          loading={modalLoading}
        />

        {/* Edit Gym Modal */}
        <EditGymModal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleUpdateGym}
          gym={selectedGym}
          gymOwners={gymOwners}
          loading={modalLoading}
        />

        {/* Delete Gym Modal */}
        <DeleteGymModal
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          gym={selectedGym}
          loading={modalLoading}
        />

        {/* View Gym Modal */}
        <ViewGymModal
          opened={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          onEdit={handleEditFromView}
          gym={selectedGym}
        />
      </Stack>
    </AppLayout>
  );
}

export default function GymsPage() {
  return (
    <GymOwnerOnly>
      <GymsPageContent />
    </GymOwnerOnly>
  );
}