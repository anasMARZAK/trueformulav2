-- Create atomic stock decrement RPC function for race-condition safe inventory management
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id TEXT, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INT;
BEGIN
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE products
  SET stock = v_current_stock - p_quantity
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;
