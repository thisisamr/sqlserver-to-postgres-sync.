-- Create the database if it doesn't exist
IF DB_ID('testdb') IS NULL
BEGIN
  CREATE DATABASE testdb;
END
GO

-- Switch to the testdb context
USE testdb;
GO

-- Create users table if not exists (SQL Server 2016+ supports this syntax)
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.users (
    id INT PRIMARY KEY IDENTITY,
    name NVARCHAR(100),
    email NVARCHAR(100)
  );
END
GO

-- Enable CDC on the database (only once per DB)
IF NOT EXISTS (
  SELECT 1 FROM sys.databases WHERE name = 'testdb' AND is_cdc_enabled = 1
)
BEGIN
  EXEC sys.sp_cdc_enable_db;
END
GO

-- Enable CDC on the users table (only if not already enabled)
IF NOT EXISTS (
  SELECT 1 FROM cdc.change_tables WHERE source_object_id = OBJECT_ID('dbo.users')
)
BEGIN
  EXEC sys.sp_cdc_enable_table
    @source_schema = 'dbo',
    @source_name = 'users',
    @role_name = NULL,
    @supports_net_changes = 0;
END
GO
