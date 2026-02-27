-- Add pdf_url field to internal_references table
ALTER TABLE internal_references
ADD COLUMN pdf_url TEXT;

-- Add comment for the field
COMMENT ON COLUMN internal_references.pdf_url IS 'PDF file URL';
