import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { PATHS } from '../../routes/paths';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="The page you're looking for doesn't exist."
      extra={
        <Button type="primary" onClick={() => navigate(PATHS.dashboard)}>
          Back to Dashboard
        </Button>
      }
    />
  );
}
