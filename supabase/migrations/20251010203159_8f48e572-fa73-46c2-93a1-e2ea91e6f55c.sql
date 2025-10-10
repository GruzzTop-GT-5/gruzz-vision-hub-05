-- Update priority costs to match expected values
UPDATE system_settings 
SET setting_value = '{"normal": 15, "high": 35, "urgent": 55}'::jsonb,
    updated_at = now()
WHERE setting_key = 'priority_costs';