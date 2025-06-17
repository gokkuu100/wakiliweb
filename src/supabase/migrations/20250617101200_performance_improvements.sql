-- Create stored procedures for efficient data fetching
-- This will improve performance by reducing the number of queries and database roundtrips

-- Function to get contract stats for a user in a single query
CREATE OR REPLACE FUNCTION get_contract_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH counts AS (
    SELECT
      COUNT(*) FILTER (WHERE TRUE) AS total,
      COUNT(*) FILTER (WHERE status = 'pending_signature') AS pending_signature,
      COUNT(*) FILTER (WHERE status = 'signed') AS signed,
      COUNT(*) FILTER (WHERE status = 'draft') AS draft
    FROM contracts
    WHERE created_by = user_id
  )
  SELECT row_to_json(counts) INTO result FROM counts;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lawyer stats in a single query
CREATE OR REPLACE FUNCTION get_lawyer_stats(lawyer_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  case_count INTEGER;
  active_count INTEGER;
  client_count INTEGER;
BEGIN
  -- Get total cases count
  SELECT COUNT(*) INTO case_count
  FROM cases
  WHERE lawyer_id = $1;
  
  -- Get active cases count
  SELECT COUNT(*) INTO active_count
  FROM cases
  WHERE lawyer_id = $1 AND status = 'active';
  
  -- Get unique client count
  SELECT COUNT(DISTINCT client_email) INTO client_count
  FROM cases
  WHERE lawyer_id = $1;
  
  -- Build JSON result
  result := json_build_object(
    'total_cases', case_count,
    'active_cases', active_count,
    'client_count', client_count
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(user_id UUID, notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE user_id = $1 AND id = ANY($2);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE user_id = $1 AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_contracts_created_by_status ON contracts(created_by, status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by_date ON documents(uploaded_by, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_status ON cases(lawyer_id, status);
