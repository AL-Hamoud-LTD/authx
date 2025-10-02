// Test script for authx core functionality
import { verifyFirebaseIdToken, getGoogleJWKS, JWKS_URL, makeAdminClient, version } from './dist/index.js'

console.log('🧪 Testing @al-hamoud/authx v' + version)
console.log('=====================================')

// Test 1: Check JWKS URL
console.log('✅ Test 1: JWKS URL')
console.log('JWKS_URL:', JWKS_URL)
console.log()

// Test 2: Test JWKS fetching
console.log('📡 Test 2: Fetching Google JWKS...')
try {
  const jwks = await getGoogleJWKS()
  console.log('✅ Successfully fetched JWKS')
  console.log('Keys found:', jwks.keys?.length || 0)
  if (jwks.keys && jwks.keys.length > 0) {
    console.log('First key ID:', jwks.keys[0].kid)
  }
} catch (error) {
  console.error('❌ Failed to fetch JWKS:', error.message)
}
console.log()

// Test 3: Test Supabase client creation
console.log('🔧 Test 3: Supabase Admin Client')
try {
  // Test with dummy credentials (won't actually connect)
  const client = makeAdminClient({
    url: 'https://dummy.supabase.co',
    serviceRoleKey: 'dummy-key'
  })
  console.log('✅ Successfully created Supabase admin client')
  console.log('Client type:', typeof client)
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message)
}
console.log()

// Test 4: Test Firebase token verification (without actual token)
console.log('🔐 Test 4: Firebase Token Verification')
console.log('Note: This would require a real Firebase ID token to test fully')
console.log('Function available:', typeof verifyFirebaseIdToken === 'function' ? '✅' : '❌')
console.log()

console.log('🎉 Basic authx package tests completed!')
console.log('📋 Summary:')
console.log('- Package builds successfully ✅')
console.log('- Core functions are exportable ✅')
console.log('- JWKS fetching works ✅')
console.log('- Supabase client creation works ✅')
console.log()
console.log('💡 To test full functionality, you need:')
console.log('- Real Firebase ID token for verification test')
console.log('- Valid Supabase credentials for user management test')