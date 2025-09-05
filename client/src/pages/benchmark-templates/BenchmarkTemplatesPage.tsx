import { useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { BenchmarkTemplatesTable } from '../../components/benchmark-templates/BenchmarkTemplatesTable.tsx';
import { useBenchmarkTemplates } from '../../hooks/useBenchmarkTemplates.ts';
import type { BenchmarkTemplate } from '../../types/benchmarks.ts';

export function BenchmarkTemplatesPage() {
  const { 
    benchmarkTemplates, 
    loading, 
    pagination,
    fetchBenchmarkTemplates, 
    createBenchmarkTemplate, 
    updateBenchmarkTemplate, 
    deleteBenchmarkTemplate 
  } = useBenchmarkTemplates();

  useEffect(() => {
    const loadData = async () => {
      await fetchBenchmarkTemplates({ page: 1, limit: 50 });
    };
    
    loadData();
  }, []); // Empty dependency array for initial load only

  const handleSearch = useCallback(async (filters: Record<string, any>) => {
    await fetchBenchmarkTemplates({ ...filters, page: 1, limit: 50 });
  }, [fetchBenchmarkTemplates]);

  const handlePageChange = useCallback(async (page: number) => {
    await fetchBenchmarkTemplates({ page, limit: 50 });
  }, [fetchBenchmarkTemplates]);

  const handleAddBenchmarkTemplate = () => {
    // TODO: Open create benchmark template modal
    console.log('Add benchmark template');
  };

  const handleEditBenchmarkTemplate = (benchmarkTemplate: BenchmarkTemplate) => {
    // TODO: Open edit benchmark template modal
    console.log('Edit benchmark template:', benchmarkTemplate);
  };

  const handleDeleteBenchmarkTemplate = (benchmarkTemplate: BenchmarkTemplate) => {
    // TODO: Implement delete confirmation and logic
    console.log('Delete benchmark template:', benchmarkTemplate);
  };

  const handleViewBenchmarkTemplate = (benchmarkTemplate: BenchmarkTemplate) => {
    // TODO: Open view benchmark template modal
    console.log('View benchmark template:', benchmarkTemplate);
  };

  return (
    <AppLayout>
      <BenchmarkTemplatesTable
        benchmarkTemplates={benchmarkTemplates}
        loading={loading}
        pagination={pagination}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onAddBenchmarkTemplate={handleAddBenchmarkTemplate}
        onEditBenchmarkTemplate={handleEditBenchmarkTemplate}
        onDeleteBenchmarkTemplate={handleDeleteBenchmarkTemplate}
        onViewBenchmarkTemplate={handleViewBenchmarkTemplate}
      />
    </AppLayout>
  );
}
