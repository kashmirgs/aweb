import { NavLink } from 'react-router-dom';
import { Bot, Cpu, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePermissionStore } from '../../stores/permissionStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/settings/agents', label: 'Ajanlar', icon: <Bot className="h-5 w-5" /> },
  { to: '/settings/models', label: 'Model Yonetimi', icon: <Cpu className="h-5 w-5" />, superAdminOnly: true },
  { to: '/settings/users', label: 'Kullanıcılar', icon: <Users className="h-5 w-5" />, superAdminOnly: true },
];

export function SettingsSidebar() {
  const { isSuperAdmin } = usePermissionStore();

  const visibleItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin()
  );

  // Debug log
  console.log('SettingsSidebar Debug:', {
    navItems,
    visibleItems,
    isSuperAdmin: isSuperAdmin(),
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ayarlar</h2>
        <nav className="space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default SettingsSidebar;
