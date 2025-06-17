-- Migration: Add indexes and optimizations for better performance
-- Created: 2025-06-17

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts (created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts (status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON cases (lawyer_id);

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true 
    WHERE user_id = mark_all_notifications_read.user_id 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for dashboard stats to improve performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_stats AS
SELECT 
    u.id as user_id,
    u.user_type,
    COUNT(DISTINCT c.id) as total_contracts,
    SUM(CASE WHEN c.status = 'pending_signature' THEN 1 ELSE 0 END) as pending_contracts,
    SUM(CASE WHEN c.status = 'signed' THEN 1 ELSE 0 END) as signed_contracts,
    SUM(CASE WHEN c.status = 'draft' THEN 1 ELSE 0 END) as draft_contracts,
    COUNT(DISTINCT d.id) as total_documents,
    SUM(CASE WHEN d.status = 'analyzed' THEN 1 ELSE 0 END) as analyzed_documents,
    SUM(CASE WHEN d.status = 'processing' THEN 1 ELSE 0 END) as processing_documents,
    SUM(CASE WHEN n.is_read = false THEN 1 ELSE 0 END) as unread_notifications,
    COUNT(DISTINCT CASE WHEN l.user_type = 'lawyer' THEN ca.id END) as total_cases,
    SUM(CASE WHEN l.user_type = 'lawyer' AND ca.status = 'active' THEN 1 ELSE 0 END) as active_cases
FROM 
    users u
LEFT JOIN 
    contracts c ON u.id = c.created_by
LEFT JOIN 
    documents d ON u.id = d.uploaded_by
LEFT JOIN 
    notifications n ON u.id = n.user_id
LEFT JOIN 
    cases ca ON u.id = ca.lawyer_id AND u.user_type = 'lawyer'
GROUP BY 
    u.id, u.user_type;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh materialized view when data changes
DROP TRIGGER IF EXISTS refresh_user_stats_contracts ON contracts;
CREATE TRIGGER refresh_user_stats_contracts
AFTER INSERT OR UPDATE OR DELETE ON contracts
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_stats();

DROP TRIGGER IF EXISTS refresh_user_stats_documents ON documents;
CREATE TRIGGER refresh_user_stats_documents
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_stats();

DROP TRIGGER IF EXISTS refresh_user_stats_notifications ON notifications;
CREATE TRIGGER refresh_user_stats_notifications
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_stats();

DROP TRIGGER IF EXISTS refresh_user_stats_cases ON cases;
CREATE TRIGGER refresh_user_stats_cases
AFTER INSERT OR UPDATE OR DELETE ON cases
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_stats();
