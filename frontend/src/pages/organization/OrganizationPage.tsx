import { Tabs } from 'antd';
import { ApartmentOutlined, TagsOutlined, TeamOutlined } from '@ant-design/icons';
import { DepartmentsTab } from './components/DepartmentsTab';
import { CategoriesTab } from './components/CategoriesTab';
import { EmployeesTab } from './components/EmployeesTab';

export default function OrganizationPage() {
  return (
    <div>
      <Tabs
        defaultActiveKey="departments"
        items={[
          {
            key: 'departments',
            label: (
              <span>
                <ApartmentOutlined /> Departments
              </span>
            ),
            children: <DepartmentsTab />,
          },
          {
            key: 'categories',
            label: (
              <span>
                <TagsOutlined /> Asset Categories
              </span>
            ),
            children: <CategoriesTab />,
          },
          {
            key: 'employees',
            label: (
              <span>
                <TeamOutlined /> Employee Directory
              </span>
            ),
            children: <EmployeesTab />,
          },
        ]}
      />
    </div>
  );
}
