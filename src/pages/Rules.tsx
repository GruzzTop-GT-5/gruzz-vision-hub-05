import React from 'react';
import { Layout } from '@/components/Layout';
import { PlatformRules } from '@/components/PlatformRules';
import { useAuth } from '@/hooks/useAuth';

const Rules = () => {
  const { user, userRole, signOut } = useAuth();

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