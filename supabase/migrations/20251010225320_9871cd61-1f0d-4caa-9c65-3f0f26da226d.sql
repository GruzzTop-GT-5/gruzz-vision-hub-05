-- Allow users to view other users' basic profile information
DROP POLICY IF EXISTS "Users can view other users basic info" ON profiles;

CREATE POLICY "Users can view other users basic info"
ON profiles
FOR SELECT
TO authenticated
USING (true);