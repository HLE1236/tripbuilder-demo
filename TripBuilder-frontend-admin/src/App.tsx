import { Theme } from '@astryxdesign/core/theme';
import {
  Icon,
  LogoutIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  type IconName,
} from './components/icon';
import { tripBuilderAdminTheme } from './config/theme';
import { useAdminOverviewQuery, useAdminPortal } from './hooks';
import type { AdminTab } from './stores';
import { CatalogView } from './views/admin/CatalogView';
import { OperationsView } from './views/admin/OperationsView';
import { OverviewView } from './views/admin/OverviewView';
import { UsersView } from './views/admin/UsersView';
import { LoginPage } from './views/auth/LoginPage';

const NAV_ITEMS: { id: AdminTab; label: string; desc: string; icon: IconName }[] = [
  { id: 'overview', label: 'Tổng quan KPI', desc: 'Doanh thu & đơn toàn sàn', icon: 'dashboard' },
  { id: 'users', label: 'Người dùng', desc: 'Khách, Guide & cấp mới', icon: 'users' },
  { id: 'operations', label: 'Tour & Đơn đặt', desc: 'Giám sát lịch trình', icon: 'clipboard' },
  { id: 'catalog', label: 'Vùng & Kho dịch vụ', desc: 'Kho dịch vụ vùng', icon: 'layers' },
];

export function App() {
  const {
    user,
    bootstrapping,
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    handleLoginSuccess,
    handleLogout,
  } = useAdminPortal();
  const { data: overview } = useAdminOverviewQuery();
  const pendingApplications = overview?.pendingGuideApplications ?? 0;

  if (bootstrapping) {
    return (
      <Theme theme={tripBuilderAdminTheme} mode={theme}>
        <div className="min-h-screen bg-canvas text-ink flex items-center justify-center text-sm text-ink-2">
          Đang khởi tạo Bàn điều hành Hệ thống...
        </div>
      </Theme>
    );
  }

  if (!user) {
    return (
      <Theme theme={tripBuilderAdminTheme} mode={theme}>
        <LoginPage onSuccess={handleLoginSuccess} />
      </Theme>
    );
  }

  return (
    <Theme theme={tripBuilderAdminTheme} mode={theme}>
      <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-64 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-rule bg-surface flex flex-col justify-between">
          <div>
            {/* Brand */}
            <div className="px-5 py-4 border-b border-rule flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D9381E] text-white flex items-center justify-center font-display font-semibold text-sm shrink-0">
                TB
              </div>
              <div className="min-w-0">
                <div className="font-display font-semibold text-sm text-ink truncate">
                  TripBuilder Admin
                </div>
                <div className="text-xs text-ink-3 truncate">Điều hành Hệ thống</div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
              {NAV_ITEMS.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition shrink-0 cursor-pointer ${
                      active
                        ? 'bg-coral-soft text-coral font-medium'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    <Icon name={item.icon} size={17} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm leading-tight">{item.label}</span>
                        {item.id === 'users' && pendingApplications > 0 && (
                          <span className="num px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-soft text-amber">
                            {pendingApplications}
                          </span>
                        )}
                      </div>
                      <div className="hidden lg:block text-xs text-ink-3 truncate mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Shell */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Header */}
          <header className="h-14 border-b border-rule bg-surface px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-ink-2 truncate">
              <ShieldCheckIcon size={16} className="text-coral shrink-0" />
              <span className="font-medium text-ink truncate">
                {NAV_ITEMS.find((i) => i.id === activeTab)?.label}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-rule">
                <div className="text-right">
                  <div className="text-xs font-medium text-ink leading-tight">
                    {user.fullName}
                  </div>
                  <div className="num text-[11px] text-ink-3 leading-tight">{user.email}</div>
                </div>
                <span className="tag tag-terracotta text-xs">Quản trị viên</span>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="btn btn-ghost px-2.5 py-2"
                title={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
                aria-label="Đổi giao diện sáng/tối"
              >
                {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
              </button>

              <button type="button" onClick={handleLogout} className="btn btn-ghost px-3 py-2">
                <LogoutIcon size={15} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'operations' && <OperationsView />}
            {activeTab === 'catalog' && <CatalogView />}
          </main>
        </div>
      </div>
    </Theme>
  );
}

export default App;
