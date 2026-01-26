import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface RoleGateProps {
    allowedRoles: string[];
    children: React.ReactNode;
    contentOnly?: boolean;
}

/**
 * RoleGate Component
 * Prevents access to specific features or entire routes based on user role.
 */
const RoleGate: React.FC<RoleGateProps> = ({ allowedRoles, children, contentOnly = false }) => {
    const { userRole, loading } = useAuth();

    if (loading) return null;

    const isAuthorized = allowedRoles.includes(userRole);

    if (!isAuthorized) {
        if (contentOnly) return null;
        // Redirect to home or login if not authorized for the entire route
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default RoleGate;
