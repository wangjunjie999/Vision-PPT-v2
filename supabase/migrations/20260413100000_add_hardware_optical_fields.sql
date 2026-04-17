-- Add optical / shutter fields to hardware tables
-- These columns are already referenced by the frontend (HardwareContext, visionCalcEngine)
-- but were never created in the database.

ALTER TABLE cameras
  ADD COLUMN IF NOT EXISTS shutter_type TEXT DEFAULT NULL;

ALTER TABLE lenses
  ADD COLUMN IF NOT EXISTS resolving_power NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_sensor_size TEXT DEFAULT NULL;
