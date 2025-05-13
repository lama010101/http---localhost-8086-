import ProfileLayout1 from "@/components/layouts/ProfileLayout1";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// Rename component
const ProfilePage = () => {
  const { user } = useAuth();
  
  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Navigate to="/test/auth" />;
  }

  return <ProfileLayout1 />;
};

export default ProfilePage; // Export with new name 