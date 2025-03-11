
import { ReactNode } from 'react';
import { useLocation, Redirect } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/spinner';

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
