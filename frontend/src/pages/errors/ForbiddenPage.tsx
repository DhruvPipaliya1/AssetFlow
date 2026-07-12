import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { PATHS } from '../../routes/paths';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="You don't have permission to view this page."
      extra={
        <Button type="primary" onClick={() => navigate(PATHS.dashboard)}>
          Back to Dashboard
        </Button>
      }
    />
  );
}
