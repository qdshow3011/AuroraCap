-- Create contracts table to store fund-related contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    fund_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contract_signings table to store user contract signing records
CREATE TABLE IF NOT EXISTS contract_signings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'signed',
    CONSTRAINT unique_user_contract UNIQUE (user_id, contract_id)
);

-- Add RLS policies for contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read contracts" ON contracts
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can create, update, delete contracts" ON contracts
    FOR ALL
    USING (auth.role() = 'admin')
    WITH CHECK (auth.role() = 'admin');

-- Add RLS policies for contract_signings table
ALTER TABLE contract_signings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own contract signings" ON contract_signings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create contract signings" ON contract_signings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_contracts_fund_id ON contracts(fund_id);
CREATE INDEX idx_contract_signings_user_id ON contract_signings(user_id);
CREATE INDEX idx_contract_signings_contract_id ON contract_signings(contract_id);
