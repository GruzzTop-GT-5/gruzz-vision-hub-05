-- Update user role to system_admin for user with phone 0000000000
UPDATE profiles 
SET role = 'system_admin'::user_role 
WHERE phone = '0000000000';