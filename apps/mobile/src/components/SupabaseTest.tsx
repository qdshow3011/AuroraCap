import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [keyInfo, setKeyInfo] = useState<{length: number, startsWith: string, hasDots: boolean}>({length: 0, startsWith: '', hasDots: false});

  const testSupabase = async () => {
    try {
      setStatus('Testing Supabase connection...');
      setError('');

      // Check if supabase is initialized
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      setStatus('Checking API key...');
      
      // Test simple API call
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        setStatus('API call failed');
        setError(`${error.message} (${error.code})`);
      } else {
        setStatus('API call successful!');
        setError('');
      }

    } catch (err: any) {
      setStatus('Unexpected error');
      setError(err.message);
      console.error('Supabase test error:', err);
    }
  };

  useEffect(() => {
    // Display key information
    if (supabase) {
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdHJxbG5kZmJoZ3Vxa2xubngiLCJleHAiOjE3OTI0MzAwMDAsImlhdCI6MTcwNzA2NjAwMCwic3ViIjoiYW5vbnltb3VzIiwibmFtZSI6ImF1dGhlbnRpY2F0ZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzA3MDY2MDAwLCJleHAiOjE3OTI0MzAwMDB9.X7xU4X4X4X4X4X4X4X4X4X4X4X4X4X4X4X4X4X4X4X4X4X';
      setKeyInfo({
        length: key.length,
        startsWith: key.substring(0, 20) + '...',
        hasDots: key.includes('...')
      });
    }
  }, []);

  return (
    <View style={{ padding: 20, backgroundColor: '#000', flex: 1 }}>
      <Text style={{ color: '#fff', fontSize: 18, marginBottom: 20 }}>Supabase Test</Text>
      
      <Text style={{ color: '#888', marginBottom: 10 }}>API Key Info:</Text>
      <Text style={{ color: '#fff', marginBottom: 5 }}>Length: {keyInfo.length}</Text>
      <Text style={{ color: '#fff', marginBottom: 5 }}>Starts with: {keyInfo.startsWith}</Text>
      <Text style={{ color: '#fff', marginBottom: 20 }}>Has trailing dots: {keyInfo.hasDots ? 'Yes' : 'No'}</Text>
      
      <Button title="Test Supabase" onPress={testSupabase} />
      
      <Text style={{ color: '#fff', marginTop: 20, fontSize: 16 }}>{status}</Text>
      {error ? <Text style={{ color: '#f00', marginTop: 10 }}>Error: {error}</Text> : null}
    </View>
  );
}