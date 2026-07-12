import { Row, Col, Card, DatePicker, Button, Space, Form, message, Spin, Alert, Select } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../services/reports.service';
import { downloadBlob, generateFilename } from '../../lib/download';
import { useAuth } from '../../lib/auth';
import { UtilizationChart } from './components/UtilizationChart';
import { MaintenanceFrequencyChart } from './components/MaintenanceFrequencyChart';
import { DepartmentSummaryChart } from './components/DepartmentSummaryChart';
import { BookingHeatmapChart } from './components/BookingHeatmapChart';

const { RangePicker } = DatePicker;

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const params = {
    startDate: dateRange[0]?.format('YYYY-MM-DD'),
    endDate: dateRange[1]?.format('YYYY-MM-DD'),
    departmentId,
    categoryId,
  };

  const {
    data: utilizationData,
    isLoading: utilLoading,
    error: utilError,
    refetch: refetchUtil,
  } = useQuery({
    queryKey: ['reports', 'utilization', params],
    queryFn: () => reportsApi.utilization(params),
    enabled: isAdminOrManager,
  });

  const {
    data: maintenanceData,
    isLoading: maintLoading,
    error: maintError,
    refetch: refetchMaint,
  } = useQuery({
    queryKey: ['reports', 'maintenance-frequency', params],
    queryFn: () => reportsApi.maintenanceFrequency(params),
    enabled: isAdminOrManager,
  });

  const {
    data: deptData,
    isLoading: deptLoading,
    error: deptError,
    refetch: refetchDept,
  } = useQuery({
    queryKey: ['reports', 'department-summary', params],
    queryFn: () => reportsApi.departmentSummary(params),
    enabled: isAdminOrManager,
  });

  const {
    data: heatmapData,
    isLoading: heatmapLoading,
    error: heatmapError,
    refetch: refetchHeatmap,
  } = useQuery({
    queryKey: ['reports', 'booking-heatmap', params],
    queryFn: () => reportsApi.bookingHeatmap(params),
    enabled: isAdminOrManager,
  });

  const loading = utilLoading || maintLoading || deptLoading || heatmapLoading;
  const error = utilError || maintError || deptError || heatmapError;

  const handleDownloadCsv = async (
    apiCall: () => Promise<{ data: Blob }>,
    filenamePrefix: string
  ) => {
    try {
      const response = await apiCall();
      downloadBlob(response.data, generateFilename(filenamePrefix));
      message.success('CSV downloaded successfully');
    } catch (err) {
      message.error('Failed to download CSV');
      console.error(err);
    }
  };

  const refreshAll = () => {
    refetchUtil();
    refetchMaint();
    refetchDept();
    refetchHeatmap();
    message.success('Refreshing reports...');
  };

  if (!isAdminOrManager) {
    return (
      <Card style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You need Admin or Asset Manager role to view reports."
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Form layout="inline" onValuesChange={({ dateRange: d, departmentId: dept, categoryId: cat }) => {
          if (d) setDateRange(d);
          if (dept !== undefined) setDepartmentId(dept);
          if (cat !== undefined) setCategoryId(cat);
        }}>
          <Form.Item label="Date Range" name="dateRange">
            <RangePicker
              style={{ width: 300 }}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
              value={dateRange}
            />
          </Form.Item>

          <Form.Item label="Department" name="departmentId">
            <Select
              style={{ width: 200 }}
              placeholder="All Departments"
              value={departmentId}
              options={[]}
              allowClear
              onChange={setDepartmentId}
            />
          </Form.Item>

          <Form.Item label="Category" name="categoryId">
            <Select
              style={{ width: 200 }}
              placeholder="All Categories"
              value={categoryId}
              options={[]}
              allowClear
              onChange={setCategoryId}
            />
          </Form.Item>

          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={refreshAll}
            >
              Refresh
            </Button>
          </Space>
        </Form>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadCsv(
                () => reportsApi.downloadUtilizationCsv(params),
                'utilization-report'
              )}
              disabled={loading || !utilizationData?.data?.length}
            >
              Utilization CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadCsv(
                () => reportsApi.downloadMaintenanceFrequencyCsv(params),
                'maintenance-frequency-report'
              )}
              disabled={loading || !maintenanceData?.data?.length}
            >
              Maintenance CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadCsv(
                () => reportsApi.downloadDepartmentSummaryCsv(params),
                'department-summary-report'
              )}
              disabled={loading || !deptData?.data?.length}
            >
              Department CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadCsv(
                () => reportsApi.downloadBookingHeatmapCsv(params),
                'booking-heatmap-report'
              )}
              disabled={loading || !heatmapData?.data?.length}
            >
              Heatmap CSV
            </Button>
          </Space>
        </div>
      </Card>

      {error && (
        <Alert
          message="Failed to load reports"
          description={error instanceof Error ? error.message : 'Unknown error'}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Charts Grid */}
      <Spin spinning={loading} tip="Loading reports...">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <UtilizationChart data={utilizationData?.data || []} />
          </Col>
          <Col xs={24} lg={12}>
            <MaintenanceFrequencyChart data={maintenanceData?.data || []} />
          </Col>
          <Col xs={24} lg={12}>
            <DepartmentSummaryChart data={deptData?.data || []} />
          </Col>
          <Col xs={24} lg={12}>
            <BookingHeatmapChart data={heatmapData?.data || []} />
          </Col>
        </Row>
      </Spin>
    </div>
  );
}