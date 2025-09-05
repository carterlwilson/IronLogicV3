'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../lib/auth-context';
import { useBenchmarkTemplates } from '../../hooks/useBenchmarkTemplates';
import { useGyms } from '../../hooks/useGyms';
import { BenchmarkTemplate, BenchmarkTemplatesQueryParams } from '../../lib/benchmark-templates-api';
import { BenchmarkTemplatesTable } from '../../components/benchmark-templates/BenchmarkTemplatesTable';
import { AddBenchmarkTemplateModal } from '../../components/benchmark-templates/AddBenchmarkTemplateModal';
import { EditBenchmarkTemplateModal } from '../../components/benchmark-templates/EditBenchmarkTemplateModal';
import { DeleteBenchmarkTemplateModal } from '../../components/benchmark-templates/DeleteBenchmarkTemplateModal';
import { ViewBenchmarkTemplateModal } from '../../components/benchmark-templates/ViewBenchmarkTemplateModal';
import { AppLayout } from '../../components/layout/AppLayout';

export default function BenchmarkTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const { gyms, fetchGyms } = useGyms();
  
  const {
    benchmarkTemplates,
    tags,
    loading,
    pagination,
    fetchBenchmarkTemplates,
    fetchBenchmarkTags,
    createBenchmarkTemplate,
    updateBenchmarkTemplate,
    deleteBenchmarkTemplate
  } = useBenchmarkTemplates();

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BenchmarkTemplate | null>(null);

  // Current search/filter parameters
  const [currentParams, setCurrentParams] = useState<BenchmarkTemplatesQueryParams>({
    page: 1,
    limit: 10,
    sort: 'name'
  });

  // Check if user has access to benchmark templates management
  const hasAccess = user && ['admin', 'gym_owner', 'coach'].includes(user.userType);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (hasAccess) {
      fetchBenchmarkTemplates(currentParams);
      fetchBenchmarkTags(user.userType === 'admin' ? undefined : (user.gymId ? String(user.gymId) : undefined));
      
      // Load gyms if user is admin (needed for gym selection)
      if (user.userType === 'admin') {
        fetchGyms();
      }
    }
  }, [user, hasAccess, fetchBenchmarkTemplates, fetchBenchmarkTags, fetchGyms]);

  // Handle search/filter changes
  const handleSearch = useCallback((filters: any) => {
    const newParams: BenchmarkTemplatesQueryParams = {
      page: 1, // Reset to first page when searching
      limit: 10,
      sort: 'name',
      ...filters
    };
    setCurrentParams(newParams);
    fetchBenchmarkTemplates(newParams);
  }, [fetchBenchmarkTemplates]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentParams(prev => {
      const newParams = { ...prev, page };
      fetchBenchmarkTemplates(newParams);
      return newParams;
    });
  }, [fetchBenchmarkTemplates]);

  // Handle add benchmark template
  const handleAddTemplate = () => {
    setAddModalOpen(true);
  };

  // Handle edit benchmark template
  const handleEditTemplate = (template: BenchmarkTemplate) => {
    setSelectedTemplate(template);
    setEditModalOpen(true);
  };

  // Handle delete benchmark template
  const handleDeleteTemplate = (template: BenchmarkTemplate) => {
    setSelectedTemplate(template);
    setDeleteModalOpen(true);
  };

  // Handle view benchmark template
  const handleViewTemplate = (template: BenchmarkTemplate) => {
    setSelectedTemplate(template);
    setViewModalOpen(true);
  };

  // Create gym options for admin users
  const gymOptions = gyms.map(gym => ({
    value: gym._id,
    label: gym.name
  }));

  // Show loading state during auth
  if (authLoading) {
    return null;
  }

  // Show access denied for unauthorized users
  if (!hasAccess) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Access Denied"
          color="red"
          variant="light"
        >
          You don't have permission to access benchmark templates management.
          Only admins, gym owners, and coaches can manage benchmark templates.
        </Alert>
      </Container>
    );
  }

  return (
    <AppLayout>
      <Container size="xl" py="md">
        <Stack gap="lg">
          <BenchmarkTemplatesTable
            benchmarkTemplates={benchmarkTemplates}
            tags={tags}
            loading={loading}
            pagination={pagination}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onAddTemplate={handleAddTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onViewTemplate={handleViewTemplate}
          />

          {/* Add Benchmark Template Modal */}
          <AddBenchmarkTemplateModal
            opened={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSubmit={createBenchmarkTemplate}
            gymOptions={gymOptions}
            loading={loading}
          />

          {/* Edit Benchmark Template Modal */}
          <EditBenchmarkTemplateModal
            opened={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedTemplate(null);
            }}
            onSubmit={updateBenchmarkTemplate}
            template={selectedTemplate}
            loading={loading}
          />

          {/* Delete Benchmark Template Modal */}
          <DeleteBenchmarkTemplateModal
            opened={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedTemplate(null);
            }}
            onConfirm={deleteBenchmarkTemplate}
            template={selectedTemplate}
            loading={loading}
          />

          {/* View Benchmark Template Modal */}
          <ViewBenchmarkTemplateModal
            opened={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedTemplate(null);
            }}
            onEdit={handleEditTemplate}
            template={selectedTemplate}
          />
        </Stack>
      </Container>
    </AppLayout>
  );
}