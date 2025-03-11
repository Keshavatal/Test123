
import { ReactNode } from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/spinner';

interface PrivateRouteProps {
  path: string;
  children: ReactNode;
}

export default function PrivateRoute({ path, children }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <Route path={path}>
      {user ? children : <Redirect to="/login" />}
    </Route>
  );
}
