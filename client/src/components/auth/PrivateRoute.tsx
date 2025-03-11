
import React from 'react';
import { Route, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
  component: React.ComponentType<any>;
  path: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <Route
      {...rest}
      component={(props: any) =>
        isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isAuthenticated ? (
          <Component {...props} />
        ) : null
      }
    />
  );
};

export default PrivateRoute;
