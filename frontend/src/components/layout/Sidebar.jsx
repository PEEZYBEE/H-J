import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { 
  FaHome, 
  FaShoppingCart, 
  FaBoxOpen, 
  FaChartBar, 
  FaCog, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCashRegister,
  FaUsers,
  FaUserFriends,
  FaWarehouse,
  FaUserCog,
  FaBell,
  FaDollarSign,
  FaFileAlt,
  FaLayerGroup,
  FaShoppingBag,
  FaTruck, // ADDED for receiving
  FaClipboardCheck, // ADDED for approval
  FaBarcode, // ADDED for inventory
  FaTags // ADDED for inventory management
} from 'react-icons/fa';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'customer';

  // Role-based navigation items - UPDATED WITH INVENTORY
  const getNavItems = () => {
    const baseItems = [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: <FaHome />, 
        path: '/dashboard',
        roles: ['customer', 'cashier', 'manager', 'admin', 'receiver', 'senior']
      },
      { 
        id: 'orders',
        label: 'Orders', 
        icon: <FaShoppingBag />, 
        path: '/dashboard/orders',
        roles: ['cashier', 'manager', 'admin', 'senior']
      },
      { 
        id: 'products', 
        label: 'Products', 
        icon: <FaBoxOpen />, 
        path: '/dashboard/products',
        roles: ['customer', 'cashier', 'manager', 'admin', 'receiver', 'senior']
      },
    ];

    // ============ INVENTORY RECEIVING SYSTEM LINKS ============
    
    // For Receiving Employees
    if (userRole === 'receiver' || userRole === 'admin' || userRole === 'manager') {
      baseItems.push(
        { 
          id: 'batch-receiving', 
          label: 'Batch Receiving', 
          icon: <FaTruck />, 
          path: '/inventory/receiving',
          roles: ['receiver', 'admin', 'manager']
        }
      );
    }

    // For Senior Staff (Approval)
    if (userRole === 'senior' || userRole === 'admin' || userRole === 'manager') {
      baseItems.push(
        { 
          id: 'batch-approval', 
          label: 'Batch Approval', 
          icon: <FaClipboardCheck />, 
          path: '/inventory/approval',
          roles: ['senior', 'admin', 'manager']
        }
      );
    }

    // Inventory Management (for managers/admins)
    if (userRole === 'manager' || userRole === 'admin' || userRole === 'senior') {
      baseItems.push(
        { 
          id: 'inventory', 
          label: 'Inventory', 
          icon: <FaWarehouse />, 
          path: '/inventory',
          roles: ['manager', 'admin', 'senior']
        },
        { 
          id: 'inventory-transactions', 
          label: 'Transactions', 
          icon: <FaFileAlt />, 
          path: '/inventory/transactions',
          roles: ['manager', 'admin', 'senior']
        }
      );
    }

    // ============ EXISTING SALES & MANAGEMENT LINKS ============
    
    if (userRole === 'cashier' || userRole === 'manager' || userRole === 'admin' || userRole === 'senior') {
      baseItems.push(
        { 
          id: 'sales', 
          label: 'Sales', 
          icon: <FaCashRegister />, 
          path: '/dashboard/sales',
          roles: ['cashier', 'manager', 'admin', 'senior']
        },
        { 
          id: 'customers', 
          label: 'Customers', 
          icon: <FaUsers />, 
          path: '/dashboard/customers',
          roles: ['cashier', 'manager', 'admin', 'senior']
        }
      );
    }

    if (userRole === 'manager' || userRole === 'admin') {
      baseItems.push(
        { 
          id: 'reports', 
          label: 'Reports', 
          icon: <FaChartBar />, 
          path: '/dashboard/reports',
          roles: ['manager', 'admin']
        },
        { 
          id: 'staff', 
          label: 'Staff', 
          icon: <FaUserFriends />, 
          path: '/dashboard/staff',
          roles: ['manager', 'admin']
        }
      );
    }

    if (userRole === 'admin') {
      baseItems.push(
        { 
          id: 'system', 
          label: 'System', 
          icon: <FaUserCog />, 
          path: '/dashboard/system',
          roles: ['admin']
        },
        { 
          id: 'analytics', 
          label: 'Analytics', 
          icon: <FaLayerGroup />, 
          path: '/dashboard/analytics',
          roles: ['admin']
        }
      );
    }

    // Settings available for all roles
    baseItems.push(
      { 
        id: 'settings', 
        label: 'Settings', 
        icon: <FaCog />, 
        path: '/dashboard/settings',
        roles: ['customer', 'cashier', 'manager', 'admin', 'receiver', 'senior']
      }
    );

    return baseItems.filter(item => item.roles.includes(userRole));
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getUserInitial = () => {
    return user.full_name?.charAt(0) || user.username?.charAt(0) || 'U';
  };

  const getUserName = () => {
    return user.full_name || user.username || 'User';
  };

  const getUserRoleBadge = () => {
    const roles = {
      admin: { label: 'Admin', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
      manager: { label: 'Manager', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
      senior: { label: 'Senior Staff', color: 'bg-gradient-to-r from-orange-500 to-red-500' }, // NEW
      receiver: { label: 'Receiver', color: 'bg-gradient-to-r from-green-500 to-emerald-500' }, // NEW
      cashier: { label: 'Cashier', color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
      customer: { label: 'Customer', color: 'bg-gradient-to-r from-gray-600 to-gray-800' }
    };
    return roles[userRole] || roles.customer;
  };

  const roleBadge = getUserRoleBadge();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && window.innerWidth < 768 && (
        <div 
          className="hnj-sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        className="hnj-sidebar-toggle-mobile"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Glassmorphic Sidebar */}
      <aside className={`hnj-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="hnj-sidebar-inner">
          
          {/* Header */}
          <header className="hnj-sidebar-header">
            <button
              className="hnj-sidebar-toggle"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle sidebar"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
            
            {isOpen && (
              <div className="hnj-sidebar-logo">
                <div className="hnj-logo-icon">H&J</div>
                <div>
                  <h2>H&J Store</h2>
                  <span className="hnj-store-badge">Inventory</span>
                </div>
              </div>
            )}
          </header>

          {/* User Info */}
          {isOpen && (
            <div className="hnj-user-info">
              <div className="hnj-user-avatar">
                {getUserInitial()}
              </div>
              <div className="hnj-user-details">
                <p className="hnj-user-name">{getUserName()}</p>
                <span className={`hnj-user-role ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
                <div className="hnj-user-status">
                  <span className="hnj-status-dot"></span>
                  <span>Online</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation - Updated with inventory groups */}
          <nav className="hnj-sidebar-nav">
            {/* Main Navigation */}
            <div className="hnj-nav-section">
              {navItems.filter(item => 
                !['batch-receiving', 'batch-approval', 'inventory', 'inventory-transactions'].includes(item.id)
              ).map((item, index) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `
                    hnj-nav-item
                    ${isActive ? 'active' : ''}
                  `}
                  onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <span className="hnj-nav-icon">{item.icon}</span>
                  {isOpen && <span className="hnj-nav-label">{item.label}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="hnj-nav-tooltip">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Inventory Section Separator */}
            {(userRole === 'receiver' || userRole === 'senior' || userRole === 'manager' || userRole === 'admin') && isOpen && (
              <div className="hnj-nav-separator">
                <span>Inventory System</span>
              </div>
            )}

            {/* Inventory Navigation */}
            <div className="hnj-nav-section">
              {navItems.filter(item => 
                ['batch-receiving', 'batch-approval', 'inventory', 'inventory-transactions'].includes(item.id)
              ).map((item, index) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `
                    hnj-nav-item
                    ${isActive ? 'active' : ''}
                    ${item.id === 'batch-receiving' ? 'hnj-nav-receiving' : ''}
                    ${item.id === 'batch-approval' ? 'hnj-nav-approval' : ''}
                  `}
                  onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <span className="hnj-nav-icon">{item.icon}</span>
                  {isOpen && <span className="hnj-nav-label">{item.label}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="hnj-nav-tooltip">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <footer className="hnj-sidebar-footer">
            <button
              onClick={handleLogout}
              className="hnj-nav-item hnj-logout-btn"
            >
              <span className="hnj-nav-icon">
                <FaSignOutAlt />
              </span>
              {isOpen && <span className="hnj-nav-label">Logout</span>}
              
              {!isOpen && (
                <div className="hnj-nav-tooltip">
                  Logout
                </div>
              )}
            </button>

            {isOpen && (
              <div className="hnj-sidebar-footer-info">
                <p className="hnj-version">v1.1.0</p>
                <p className="hnj-copyright">© {new Date().getFullYear()} H&J Store</p>
              </div>
            )}
          </footer>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;