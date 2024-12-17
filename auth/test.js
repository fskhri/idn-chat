const auth = require('./index');

async function testAuth() {
  try {
    console.log('🔄 Starting auth test...');

    // Login with credentials
    const loginResult = await auth.login('email', 'password');
    console.log('\n📝 Login Result:', {
      success: true,
      hasAccessToken: !!loginResult.AuthenticationResult?.AccessToken,
      hasIdToken: !!loginResult.AuthenticationResult?.IdToken,
      hasRefreshToken: !!loginResult.AuthenticationResult?.RefreshToken
    });

    // Check if authenticated
    const isAuth = auth.isAuthenticated();
    console.log('\n🔒 Authentication Status:', isAuth);

    // Get user info if authenticated
    if (isAuth) {
      const userInfo = await auth.getUserInfo();
      console.log('\n👤 User Info:', userInfo);

      // Get balance info
      const balanceInfo = await auth.getBalanceInfo();
      console.log('\n💰 Balance Info:', balanceInfo);

      // Get tier progress
      const tierProgress = await auth.getTierProgress();
      console.log('\n🏆 Tier Progress:', tierProgress);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testAuth(); 