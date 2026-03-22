import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';
import { LogOut, Menu, X } from 'lucide-react';
import collegeLogo from '../assets/header_logo.png';
import ProfileModal from './ProfileModal';

const Sidebar = ({ menuItems }) => {
    const { user, logout } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 768px)');
        const handler = (e) => setIsMobile(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    // Close drawer when clicking a menu item on mobile
    const handleNavClick = (item, e) => {
        if (item.onClick) {
            e.preventDefault();
            item.onClick();
        }
        if (isMobile) setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Header Bar with Hamburger */}
            {isMobile && (
                <div className={styles.mobileHeader}>
                    <button
                        className={styles.hamburgerBtn}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <img src={collegeLogo} alt="SGP Logo" className={styles.mobileHeaderLogo} />
                    <button
                        className={styles.mobileTopLogoutBtn}
                        onClick={logout}
                        aria-label="Logout"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            )}

            {/* Overlay backdrop on mobile */}
            {isMobile && mobileOpen && (
                <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar - always visible on desktop, slide-in drawer on mobile */}
            <aside className={`${styles.sidebar} ${isMobile ? styles.mobileSidebar : ''} ${isMobile && mobileOpen ? styles.mobileSidebarOpen : ''}`}>
                <div className={styles.logoSection}>
                    <img src={collegeLogo} alt="SGP Logo" className={styles.sidebarLogo} />
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item, index) => {
                        const prevCategory = index > 0 ? menuItems[index - 1].category : null;
                        const showHeader = item.category && item.category !== prevCategory;

                        return (
                            <React.Fragment key={item.label}>
                                {showHeader && (
                                    <div className={styles.categoryHeader}>
                                        {item.category}
                                    </div>
                                )}
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        (item.isActive ?? isActive) ? `${styles.navItem} ${styles.active}` : styles.navItem
                                    }
                                    onClick={(e) => handleNavClick(item, e)}
                                    end
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <span className={styles.badge}>{item.badge}</span>
                                    )}
                                </NavLink>
                            </React.Fragment>
                        );
                    })}
                </nav>

                {/* Profile Card */}
                {user?.role?.toUpperCase() !== 'STUDENT' && (
                    <div className={styles.userInfo} onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }} title="View Profile">
                        <div className={styles.avatar}>
                            {(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userDetails}>
                            <p className={styles.userName}>{user?.fullName || user?.username || 'User'}</p>
                            <p className={styles.userRole}>{user?.role || 'Staff'}{user?.department ? ` • ${user.department}` : ''}</p>
                        </div>
                    </div>
                )}

                <button onClick={() => { logout(); if (isMobile) setMobileOpen(false); }} className={styles.logoutButton}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>

                {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
            </aside>
        </>
    );
};

export default Sidebar;
