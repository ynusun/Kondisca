
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ICONS } from '../constants';

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    
    const baseLinkClasses = "flex items-center p-3 my-1 rounded-lg transition-colors";
    const inactiveLinkClasses = "text-text-dark hover:bg-card hover:text-text-light";
    const activeLinkClasses = "bg-primary text-white";

    const getLinkClass = ({ isActive }: { isActive: boolean }) => 
        `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;
    
    return (
        <aside className="w-64 bg-secondary flex flex-col p-4">
            <div className="text-3xl font-bold text-primary mb-10 text-center">
                Kondisca
            </div>
            <nav className="flex flex-col h-full">
                {user?.role === UserRole.Conditioner && (
                    <>
                        <NavLink to="/" className={getLinkClass} end>
                            {ICONS.DASHBOARD} <span className="ml-3">Anasayfa</span>
                        </NavLink>
                        <NavLink to="/players" className={getLinkClass}>
                            {ICONS.PLAYERS} <span className="ml-3">Oyuncular</span>
                        </NavLink>
                         <NavLink to="/calendar" className={getLinkClass}>
                            {ICONS.CALENDAR} <span className="ml-3">Takvim</span>
                        </NavLink>
                        <div className="mt-auto">
                             <NavLink to="/survey-management" className={getLinkClass}>
                                {ICONS.SURVEY} <span className="ml-3">Anket Yönetimi</span>
                            </NavLink>
                            <NavLink to="/metrics" className={getLinkClass}>
                                {ICONS.METRICS} <span className="ml-3">Ölçümleri Yönet</span>
                            </NavLink>
                        </div>
                    </>
                )}
                {user?.role === UserRole.Player && (
                    <>
                        <NavLink to="/" className={getLinkClass} end>
                             {ICONS.DASHBOARD} <span className="ml-3">Gösterge Paneli</span>
                        </NavLink>
                        <NavLink to="/survey" className={getLinkClass}>
                            {ICONS.SURVEY} <span className="ml-3">Günlük Anket</span>
                        </NavLink>
                    </>
                )}
            </nav>
            <div className="mt-auto text-center text-xs text-text-dark">
                &copy; 2024 Kondisca
            </div>
        </aside>
    );
};


const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return user?.role === UserRole.Conditioner ? 'Anasayfa' : 'Gösterge Paneli';
        if (path.startsWith('/player/')) return 'Oyuncu Profili';
        if (path === '/players') return 'Tüm Oyuncular';
        if (path === '/metrics') return 'Ölçüm Yönetimi';
        if (path === '/survey-management') return 'Anket Yönetimi';
        if (path === '/calendar') return 'Takım Takvimi';
        if (path === '/survey') return 'Günlük Sağlık Anketi';
        return 'Kondisca';
    };

    return (
        <header className="bg-secondary p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">{getPageTitle()}</h1>
            <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2">
                    <img src={user?.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full"/>
                    <span>{user?.name}</span>
                    {ICONS.CHEVRON_DOWN}
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50">
                        <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-text-light hover:bg-primary flex items-center">
                            {ICONS.LOGOUT} Çıkış Yap
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};


const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;