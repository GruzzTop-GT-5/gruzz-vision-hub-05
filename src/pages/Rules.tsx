import React from 'react';
import { Layout } from '@/components/Layout';
import { PlatformRules } from '@/components/PlatformRules';
import { useAuthContext } from '@/contexts/AuthContext';

const Rules = () => {
  const { user, userRole, signOut } = useAuthContext();

  return (
    <Layout user={user} userRole={userRole} onSignOut={signOut}>
      <div className="min-h-screen bg-background">
        <PlatformRules />
      </div>
    </Layout>
  );
};

export { Rules };
export default Rules;